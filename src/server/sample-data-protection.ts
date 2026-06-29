import {
  createLogicalDeleteRecord,
  createProjectJsonSnapshot,
  getBackupPlans,
  parseOperationEnv,
  parseSessionConfig,
  validateInstitutionalOperation,
  validateProjectJsonImport,
  validateProtectedMetadata,
  validateServerOperation,
  type DataProtectionIssue,
  type ProjectJsonSnapshot,
} from '@/domain/data-protection';
import { getSampleAccessControlUsers, getSampleProjectPermissionAssignments } from '@/server/sample-access-control';

const projectId = 'sample-project';

const safeMetadataInput = {
  projectId,
  title: '研究データ管理支援ツールの実証研究 メタデータ',
  description: 'DMP作成支援ツールの評価結果を集約したメタデータ。実データ本体は外部RDM基盤で管理する。',
  dataType: 'survey_data',
  storageUri: 'https://rdm.example.ac.jp/sample-project/datasets/survey-2026',
  publicationStatus: 'restricted',
  license: 'CC BY 4.0',
  containsPersonalInformation: true,
  containsSensitiveInformation: false,
  consentOrContractNote: '同意条件に基づき、匿名化後の制限付き共有のみ許可する。',
  rawDataStoredInRDMate: false,
  freeText: '問い合わせは公開フォームを利用する。',
};

const riskyMetadataInput = {
  projectId,
  title: '自由記述データ contact@example.invalid',
  description: '識別子や要配慮情報を含む可能性がある自由記述。',
  dataType: 'text_corpus',
  storageUri: '/Users/example/Desktop/raw-data.csv',
  publicationStatus: 'open',
  containsPersonalInformation: true,
  containsSensitiveInformation: true,
  rawDataStoredInRDMate: true,
  freeText: '学生番号、健康情報、GPS緯度経度を含む可能性あり。',
};

const operationEnv = parseOperationEnv({
  databaseUrl: 'file:./dev.db',
  appName: 'RDMate JP',
  usageMode: 'institution',
  sessionSecret: 'sample-secret-for-institution-mode-please-replace-48chars',
  enforceHttps: true,
  backupDirectory: './backups',
  allowRawDataUpload: false,
});

const sessionConfig = parseSessionConfig({
  sessionSecret: operationEnv.sessionSecret,
  cookieSecure: true,
  maxAgeMinutes: 480,
  sameSite: 'lax',
});

const projectJsonSnapshot = createProjectJsonSnapshot({
  projectId,
  project: {
    id: projectId,
    title: '研究データ管理支援ツールの実証研究',
    summary: 'DMP作成支援ツールのMVP検証を行う。',
  },
  dmpAnswers: [
    { id: 'dmp-answer-sharing', section: 'sharing', answer: '制限付き公開。利用申請を受け付ける。' },
  ],
  datasets: [
    { id: 'dataset-survey-2026', title: '研究者アンケート回答データ', dataType: 'survey_data' },
  ],
  auditLogs: [
    { id: 'audit-dataset-update', action: 'update', entityType: 'dataset', entityId: 'dataset-survey-2026' },
  ],
});

export function getSampleProtectedMetadataIssues(): DataProtectionIssue[] {
  return validateProtectedMetadata(riskyMetadataInput);
}

export function getSampleSafeMetadataIssues(): DataProtectionIssue[] {
  return validateProtectedMetadata(safeMetadataInput);
}

export function getSampleServerValidationResult() {
  const users = getSampleAccessControlUsers();
  const assignments = getSampleProjectPermissionAssignments();
  const steward = users.find((user) => user.id === 'sample-data-steward') ?? users[0]!;

  return validateServerOperation({
    mode: 'institution',
    user: steward,
    assignments,
    projectId,
    action: 'edit_dataset',
    metadata: safeMetadataInput,
  });
}

export function getSampleOperationEnv() {
  return operationEnv;
}

export function getSampleSessionConfig() {
  return sessionConfig;
}

export function getSampleInstitutionalIssues(): DataProtectionIssue[] {
  return validateInstitutionalOperation(operationEnv);
}

export function getSampleBackupPlans() {
  return getBackupPlans(operationEnv.databaseUrl, operationEnv.backupDirectory);
}

export function getSampleProjectJsonSnapshot(): ProjectJsonSnapshot {
  return projectJsonSnapshot;
}

export function getSampleProjectJsonImportIssues(): DataProtectionIssue[] {
  return validateProjectJsonImport(projectJsonSnapshot);
}

export function getSampleLogicalDeleteRecord() {
  return createLogicalDeleteRecord({
    id: 'delete-dataset-survey-2026',
    entityType: 'dataset',
    entityId: 'dataset-survey-2026',
    requestedBy: 'sample-data-steward',
    requestedAt: '2026-06-29T09:00:00+09:00',
    confirmationText: 'DELETE dataset:dataset-survey-2026',
    deletedAt: '2026-06-29T09:01:00+09:00',
  });
}
