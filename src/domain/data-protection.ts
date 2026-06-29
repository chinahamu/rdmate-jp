import { z } from 'zod';
import {
  canPerformProjectAction,
  createAppUser,
  getProjectAssignmentForUser,
  type AppUser,
  type PermissionAction,
  type ProjectPermissionAssignment,
  type UsageMode,
} from './access-control';

export const dataProtectionPrincipleValues = [
  'metadata_only',
  'privacy_warning',
  'institutional_operations',
] as const;

export type DataProtectionPrinciple = (typeof dataProtectionPrincipleValues)[number];

export const dataProtectionPrincipleLabels: Record<DataProtectionPrinciple, string> = {
  metadata_only: '実データ本体を保持しない',
  privacy_warning: '個人情報・要配慮情報の警告',
  institutional_operations: '学内サーバ運用前提の保護',
};

export const sensitiveDataSignalValues = [
  'personal_name',
  'email_address',
  'student_id',
  'health_data',
  'genetic_data',
  'location_data',
  'raw_file_path',
  'free_text_identifier',
] as const;

export type SensitiveDataSignal = (typeof sensitiveDataSignalValues)[number];

export const sensitiveDataSignalLabels: Record<SensitiveDataSignal, string> = {
  personal_name: '氏名の可能性',
  email_address: 'メールアドレス',
  student_id: '学生番号・職員番号の可能性',
  health_data: '健康・医療情報の可能性',
  genetic_data: 'ゲノム・遺伝情報の可能性',
  location_data: '詳細位置情報の可能性',
  raw_file_path: '実データ本体への直接パスの可能性',
  free_text_identifier: '自由記述内の識別子の可能性',
};

export const dataProtectionIssueSeverityValues = ['error', 'warning', 'info'] as const;

export type DataProtectionIssueSeverity = (typeof dataProtectionIssueSeverityValues)[number];

export type DataProtectionIssue = Readonly<{
  field: string;
  severity: DataProtectionIssueSeverity;
  signal?: SensitiveDataSignal;
  message: string;
  remediation: string;
}>;

export const backupTargetValues = ['sqlite', 'postgresql', 'project_json'] as const;

export type BackupTarget = (typeof backupTargetValues)[number];

export const backupTargetLabels: Record<BackupTarget, string> = {
  sqlite: 'SQLite',
  postgresql: 'PostgreSQL',
  project_json: 'プロジェクトJSON',
};

export const deletionModeValues = ['confirm_required', 'logical_delete', 'hard_delete_blocked'] as const;

export type DeletionMode = (typeof deletionModeValues)[number];

export const protectedMetadataSchema = z.object({
  projectId: z.string().min(1, '研究課題IDは必須です。'),
  title: z.string().min(1, 'タイトルは必須です。'),
  description: z.string().min(1, '説明は必須です。'),
  dataType: z.string().min(1, 'データ種別は必須です。'),
  storageUri: z.string().min(1).optional(),
  publicationStatus: z.string().min(1).default('undecided'),
  license: z.string().min(1).optional(),
  containsPersonalInformation: z.boolean().default(false),
  containsSensitiveInformation: z.boolean().default(false),
  consentOrContractNote: z.string().min(1).optional(),
  rawDataStoredInRDMate: z.boolean().default(false),
  freeText: z.string().optional(),
});

export type ProtectedMetadataInput = z.input<typeof protectedMetadataSchema>;
export type ProtectedMetadata = z.infer<typeof protectedMetadataSchema>;

export const sessionConfigSchema = z.object({
  sessionSecret: z.string().min(32, 'SESSION_SECRETは32文字以上にしてください。'),
  cookieSecure: z.boolean().default(true),
  maxAgeMinutes: z.number().int().positive().max(1440).default(480),
  sameSite: z.enum(['lax', 'strict']).default('lax'),
});

export type SessionConfigInput = z.input<typeof sessionConfigSchema>;
export type SessionConfig = z.infer<typeof sessionConfigSchema>;

export const operationEnvSchema = z.object({
  databaseUrl: z.string().min(1, 'DATABASE_URLは必須です。'),
  appName: z.string().min(1).default('RDMate JP'),
  usageMode: z.enum(['local', 'team', 'institution']).default('local'),
  sessionSecret: z.string().min(32, 'SESSION_SECRETは32文字以上にしてください。'),
  enforceHttps: z.boolean().default(false),
  backupDirectory: z.string().min(1).default('./backups'),
  allowRawDataUpload: z.boolean().default(false),
});

export type OperationEnvInput = z.input<typeof operationEnvSchema>;
export type OperationEnv = z.infer<typeof operationEnvSchema>;

export type ServerValidationRequest = Readonly<{
  mode: UsageMode;
  user: AppUser;
  assignments: ProjectPermissionAssignment[];
  projectId: string;
  action: PermissionAction;
  metadata: ProtectedMetadataInput;
}>;

export type ServerValidationResult = Readonly<{
  allowed: boolean;
  parsed?: ProtectedMetadata;
  issues: DataProtectionIssue[];
}>;

export type BackupPlan = Readonly<{
  target: BackupTarget;
  command: string;
  restoreCommand: string;
  notes: string[];
}>;

export type ProjectJsonSnapshot = Readonly<{
  schemaVersion: string;
  exportedAt: string;
  projectId: string;
  project: Record<string, unknown>;
  dmpAnswers: Record<string, unknown>[];
  datasets: Record<string, unknown>[];
  auditLogs: Record<string, unknown>[];
}>;

export type LogicalDeleteRecord = Readonly<{
  id: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  requestedAt: string;
  mode: DeletionMode;
  confirmationText: string;
  deletedAt?: string;
}>;

export function parseOperationEnv(input: OperationEnvInput): OperationEnv {
  return operationEnvSchema.parse(input);
}

export function parseSessionConfig(input: SessionConfigInput): SessionConfig {
  return sessionConfigSchema.parse(input);
}

export function validateProtectedMetadata(input: ProtectedMetadataInput): DataProtectionIssue[] {
  const parsed = protectedMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'metadata',
      severity: 'error' as const,
      message: issue.message,
      remediation: '入力値を修正し、サーバ側の形式検証を通過させてください。',
    }));
  }

  const metadata = parsed.data;
  const issues: DataProtectionIssue[] = [];

  if (metadata.rawDataStoredInRDMate) {
    issues.push({
      field: 'rawDataStoredInRDMate',
      severity: 'error',
      signal: 'raw_file_path',
      message: 'RDMate JPは原則として実データ本体を保持しません。',
      remediation: '実データは学内ストレージ、GakuNin RDM、外部リポジトリ等に置き、RDMate JPには参照情報のみを登録してください。',
    });
  }

  if (metadata.containsPersonalInformation || metadata.containsSensitiveInformation) {
    issues.push({
      field: 'publicationStatus',
      severity: metadata.publicationStatus === 'open' ? 'error' : 'warning',
      signal: metadata.containsSensitiveInformation ? 'health_data' : 'personal_name',
      message: '個人情報・要配慮情報を含む可能性があります。',
      remediation: '公開区分をrestricted/closedにするか、匿名化・同意・契約条件を確認して公開判断に記録してください。',
    });
  }

  if ((metadata.containsPersonalInformation || metadata.containsSensitiveInformation) && !metadata.consentOrContractNote) {
    issues.push({
      field: 'consentOrContractNote',
      severity: 'warning',
      signal: 'free_text_identifier',
      message: '個人情報・要配慮情報を扱う根拠メモが未入力です。',
      remediation: '同意、倫理審査、共同研究契約、匿名化方針などの確認メモを残してください。',
    });
  }

  if (metadata.storageUri && looksLikeLocalSensitivePath(metadata.storageUri)) {
    issues.push({
      field: 'storageUri',
      severity: 'warning',
      signal: 'raw_file_path',
      message: '保存場所に個人PCのローカルパスらしき値が含まれています。',
      remediation: '学内共有ストレージ、暗号化済み保存場所、または外部リポジトリURLへの参照に置き換えてください。',
    });
  }

  for (const signal of detectSensitiveSignals(metadata.freeText ?? `${metadata.title}\n${metadata.description}`)) {
    issues.push({
      field: 'freeText',
      severity: 'warning',
      signal,
      message: `${sensitiveDataSignalLabels[signal]}を検出しました。`,
      remediation: '自由記述に識別子や要配慮情報を直接書かず、必要に応じてマスキングしてください。',
    });
  }

  return issues;
}

export function validateServerOperation(request: ServerValidationRequest): ServerValidationResult {
  const assignment = getProjectAssignmentForUser(request.assignments, request.projectId, request.user.id);
  const allowed = canPerformProjectAction({
    mode: request.mode,
    user: request.user,
    projectId: request.projectId,
    assignment,
    action: request.action,
  });
  const metadataResult = protectedMetadataSchema.safeParse(request.metadata);
  const issues = validateProtectedMetadata(request.metadata);

  if (!allowed) {
    issues.unshift({
      field: 'permission',
      severity: 'error',
      message: 'この操作を実行する権限がありません。',
      remediation: '研究課題ごとの権限割当を確認し、サーバ側でも同じ判定を強制してください。',
    });
  }

  return {
    allowed: allowed && issues.every((issue) => issue.severity !== 'error') && metadataResult.success,
    parsed: metadataResult.success ? metadataResult.data : undefined,
    issues,
  };
}

export function validateInstitutionalOperation(env: OperationEnv): DataProtectionIssue[] {
  const issues: DataProtectionIssue[] = [];

  if (env.usageMode === 'institution' && !env.enforceHttps) {
    issues.push({
      field: 'enforceHttps',
      severity: 'error',
      message: '学内サーバ運用ではHTTPSを有効にしてください。',
      remediation: 'RDMATE_ENFORCE_HTTPS=true を設定し、リバースプロキシまたはホスティング基盤でTLSを終端してください。',
    });
  }

  if (env.usageMode !== 'local' && env.sessionSecret.length < 48) {
    issues.push({
      field: 'sessionSecret',
      severity: 'warning',
      message: '複数ユーザー運用ではより長いSESSION_SECRETを推奨します。',
      remediation: 'openssl rand -base64 48 などで十分に長いランダム文字列を生成してください。',
    });
  }

  if (env.allowRawDataUpload) {
    issues.push({
      field: 'allowRawDataUpload',
      severity: 'error',
      message: '実データ本体のアップロード許可は既定方針に反します。',
      remediation: 'RDMATE_ALLOW_RAW_DATA_UPLOAD=false に戻し、参照情報のみを登録してください。',
    });
  }

  return issues;
}

export function detectSensitiveSignals(text: string): SensitiveDataSignal[] {
  const signals = new Set<SensitiveDataSignal>();
  const normalized = text.toLowerCase();

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) signals.add('email_address');
  if (/(学生番号|学籍番号|職員番号|student id|employee id)/i.test(text)) signals.add('student_id');
  if (/(病歴|診断|疾患|ゲノム|遺伝|health|medical|genetic)/i.test(text)) {
    signals.add(normalized.includes('genetic') || text.includes('遺伝') || text.includes('ゲノム') ? 'genetic_data' : 'health_data');
  }
  if (/(緯度|経度|gps|latitude|longitude)/i.test(text)) signals.add('location_data');
  if (/([A-Z]:\\|\/Users\/|\/home\/|\\\\)/.test(text)) signals.add('raw_file_path');

  return Array.from(signals);
}

export function getBackupPlans(databaseUrl: string, backupDirectory = './backups'): BackupPlan[] {
  const sqlitePath = databaseUrl.startsWith('file:') ? databaseUrl.replace(/^file:/, '') : './dev.db';

  return [
    {
      target: 'sqlite',
      command: `pnpm db:backup:sqlite -- --source ${sqlitePath} --out ${backupDirectory}`,
      restoreCommand: `pnpm db:restore:sqlite -- --backup ${backupDirectory}/rdmate.sqlite.backup --target ${sqlitePath}`,
      notes: ['SQLiteファイルを停止中または書き込みが少ない時間帯にコピーします。', '復元前に現在のDBを退避してください。'],
    },
    {
      target: 'postgresql',
      command: `pg_dump \"${databaseUrl}\" --format=custom --file=${backupDirectory}/rdmate.dump`,
      restoreCommand: `pg_restore --clean --if-exists --dbname \"${databaseUrl}\" ${backupDirectory}/rdmate.dump`,
      notes: ['PostgreSQL運用ではpg_dump/pg_restoreを利用します。', '本番DBでは権限と接続先を必ず確認してください。'],
    },
    {
      target: 'project_json',
      command: 'GET /api/data-protection/project-export?projectId=<projectId>',
      restoreCommand: 'POST /api/data-protection/project-import/preview',
      notes: ['研究課題単位の移行・確認用です。', '実データ本体ではなく、DMP・Dataset台帳・メタデータ・監査ログ等を対象にします。'],
    },
  ];
}

export function createProjectJsonSnapshot(input: Omit<ProjectJsonSnapshot, 'schemaVersion' | 'exportedAt'>): ProjectJsonSnapshot {
  return {
    schemaVersion: '1.0.0',
    exportedAt: new Date('2026-06-29T00:00:00+09:00').toISOString(),
    ...input,
  };
}

export function validateProjectJsonImport(snapshot: ProjectJsonSnapshot): DataProtectionIssue[] {
  const issues: DataProtectionIssue[] = [];

  if (snapshot.schemaVersion !== '1.0.0') {
    issues.push({
      field: 'schemaVersion',
      severity: 'warning',
      message: 'プロジェクトJSONのスキーマバージョンが現在の想定と異なります。',
      remediation: 'docs/migration.md または移行手順を確認してから取り込んでください。',
    });
  }

  if (snapshot.datasets.length === 0) {
    issues.push({
      field: 'datasets',
      severity: 'info',
      message: 'Dataset台帳が含まれていません。',
      remediation: 'DMPのみの移行で問題ないか確認してください。',
    });
  }

  return issues;
}

export function createLogicalDeleteRecord(input: Omit<LogicalDeleteRecord, 'mode'>): LogicalDeleteRecord {
  const expectedText = `DELETE ${input.entityType}:${input.entityId}`;
  return {
    ...input,
    mode: input.confirmationText === expectedText ? 'logical_delete' : 'confirm_required',
  };
}

export function createServerUserFromHeaders(headers: Record<string, string | undefined>): AppUser {
  return createAppUser({
    id: headers['x-rdmate-user-id'] ?? 'anonymous',
    username: headers['x-rdmate-username'] ?? 'anonymous',
    email: headers['x-rdmate-email'] ?? 'anonymous@example.invalid',
    affiliation: headers['x-rdmate-affiliation'] ?? 'unknown',
    role: (headers['x-rdmate-role'] as AppUser['role'] | undefined) ?? 'VIEWER',
    mode: (headers['x-rdmate-mode'] as AppUser['mode'] | undefined) ?? 'local',
  });
}

function looksLikeLocalSensitivePath(value: string): boolean {
  return /([A-Z]:\\|\/Users\/|\/home\/|\\\\)/.test(value);
}
