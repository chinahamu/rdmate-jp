import { z } from 'zod';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日付はYYYY-MM-DD形式で入力してください。',
});

const doiSchema = z.string().regex(/^10\.\d{4,9}\/\S+$/i, {
  message: 'DOIは10.xxxx/xxxxx形式で入力してください。',
});

export const datasetTypeValues = [
  'experimental_data',
  'observational_data',
  'simulation_data',
  'survey_data',
  'image_video',
  'audio',
  'text_corpus',
  'source_code',
  'processed_data',
  'metadata_only',
] as const;

export type DatasetType = (typeof datasetTypeValues)[number];

export const datasetTypeLabels: Record<DatasetType, string> = {
  experimental_data: '実験データ',
  observational_data: '観測データ',
  simulation_data: 'シミュレーションデータ',
  survey_data: '調査データ',
  image_video: '画像・動画',
  audio: '音声',
  text_corpus: 'テキストコーパス',
  source_code: 'ソースコード',
  processed_data: '解析済みデータ',
  metadata_only: 'メタデータのみ',
};

export const datasetStatusValues = [
  'unchecked',
  'draft',
  'in_progress',
  'needs_action',
  'ready',
  'published',
  'archived',
] as const;

export type DatasetStatus = (typeof datasetStatusValues)[number];

export const datasetStatusLabels: Record<DatasetStatus, string> = {
  unchecked: '未チェック',
  draft: '下書き',
  in_progress: '作業中',
  needs_action: '要対応',
  ready: '登録準備完了',
  published: '公開済み',
  archived: 'アーカイブ済み',
};

export const publicationStatusValues = ['open', 'embargoed', 'restricted', 'closed', 'undecided'] as const;

export type PublicationStatus = (typeof publicationStatusValues)[number];

export const publicationStatusLabels: Record<PublicationStatus, string> = {
  open: '公開可能',
  embargoed: '一定期間後に公開',
  restricted: '制限付き公開',
  closed: '非公開',
  undecided: '未定',
};

export const datasetLicenseValues = [
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC0 1.0',
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'Custom / Not specified',
] as const;

export type DatasetLicense = (typeof datasetLicenseValues)[number];

export const storageLocationTypeValues = [
  'local_path',
  'network_drive',
  'cloud_url',
  'gakunin_rdm_url',
  'github_url',
  'external_repository',
  'other',
] as const;

export type StorageLocationType = (typeof storageLocationTypeValues)[number];

export const storageLocationTypeLabels: Record<StorageLocationType, string> = {
  local_path: 'ローカルパス',
  network_drive: 'ネットワークドライブ',
  cloud_url: 'クラウドストレージURL',
  gakunin_rdm_url: 'GakuNin RDM URL',
  github_url: 'GitHub URL',
  external_repository: '外部リポジトリ',
  other: 'その他',
};

export const datasetCsvColumns = [
  'id',
  'project_id',
  'name',
  'description',
  'data_type',
  'generated_date',
  'last_updated_date',
  'version',
  'status',
  'created_by',
  'responsible_member_id',
  'publication_status',
  'planned_publication_date',
  'public_url',
  'doi',
  'license',
  'usage_terms',
  'citation',
  'storage_locations',
] as const;

export const storageLocationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  uri: z.string().min(1, '保存場所は必須です。'),
  storageType: z.enum(storageLocationTypeValues),
  accessScope: z.string().min(1).optional(),
  hasBackup: z.boolean().default(false),
  isEncrypted: z.boolean().default(false),
  notes: z.string().min(1).optional(),
});

export const datasetSchema = z
  .object({
    id: z.string().min(1),
    projectId: z.string().min(1, '研究課題は必須です。'),
    name: z.string().min(1, 'データセット名は必須です。'),
    description: z.string().min(1, '説明は必須です。'),
    dataType: z.enum(datasetTypeValues),
    generatedDate: dateStringSchema,
    lastUpdatedDate: dateStringSchema.optional(),
    version: z.string().min(1, 'バージョンは必須です。').default('1.0.0'),
    status: z.enum(datasetStatusValues).default('unchecked'),
    createdBy: z.string().min(1, '作成者は必須です。'),
    responsibleMemberId: z.string().min(1, '責任者は必須です。'),
    storageLocations: z.array(storageLocationSchema).default([]),
    publicationStatus: z.enum(publicationStatusValues).default('undecided'),
    plannedPublicationDate: dateStringSchema.optional(),
    publicUrl: z.string().url('公開URLの形式が正しくありません。').optional(),
    doi: doiSchema.optional(),
    license: z.enum(datasetLicenseValues).optional(),
    usageTerms: z.string().min(1).optional(),
    citation: z.string().min(1).optional(),
  })
  .superRefine((dataset, context) => {
    if (
      dataset.lastUpdatedDate &&
      new Date(dataset.generatedDate).getTime() > new Date(dataset.lastUpdatedDate).getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lastUpdatedDate'],
        message: '更新日はデータ取得/生成日以降にしてください。',
      });
    }

    if (dataset.publicationStatus === 'embargoed' && !dataset.plannedPublicationDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['plannedPublicationDate'],
        message: '一定期間後に公開する場合は公開予定日を入力してください。',
      });
    }
  });

export type StorageLocationInput = z.input<typeof storageLocationSchema>;
export type StorageLocation = z.infer<typeof storageLocationSchema>;
export type DatasetInput = z.input<typeof datasetSchema>;
export type Dataset = z.infer<typeof datasetSchema>;

export type DatasetFilterCriteria = Readonly<{
  projectId?: string;
  dataType?: DatasetType;
  status?: DatasetStatus;
  publicationStatus?: PublicationStatus;
  responsibleMemberId?: string;
  license?: DatasetLicense;
}>;

export type DatasetLedgerIssueSeverity = 'error' | 'warning' | 'info';

export type DatasetLedgerIssue = Readonly<{
  datasetId: string;
  field: string;
  severity: DatasetLedgerIssueSeverity;
  message: string;
}>;

export type DatasetAttentionState = 'ready' | 'unchecked' | 'needs_action';

export type DatasetCsvImportError = Readonly<{
  rowNumber: number;
  messages: string[];
}>;

export type DatasetCsvImportResult = Readonly<{
  datasets: Dataset[];
  errors: DatasetCsvImportError[];
}>;

export function createDataset(input: DatasetInput): Dataset {
  return datasetSchema.parse(input);
}

export function createStorageLocation(input: StorageLocationInput): StorageLocation {
  return storageLocationSchema.parse(input);
}

export function getDatasetTypeLabel(dataType: DatasetType): string {
  return datasetTypeLabels[dataType];
}

export function getDatasetStatusLabel(status: DatasetStatus): string {
  return datasetStatusLabels[status];
}

export function getPublicationStatusLabel(status: PublicationStatus): string {
  return publicationStatusLabels[status];
}

export function getStorageLocationTypeLabel(storageType: StorageLocationType): string {
  return storageLocationTypeLabels[storageType];
}

export function filterDatasets(datasets: Dataset[], criteria: DatasetFilterCriteria): Dataset[] {
  return datasets.filter((dataset) => {
    if (criteria.projectId && dataset.projectId !== criteria.projectId) return false;
    if (criteria.dataType && dataset.dataType !== criteria.dataType) return false;
    if (criteria.status && dataset.status !== criteria.status) return false;
    if (criteria.publicationStatus && dataset.publicationStatus !== criteria.publicationStatus) return false;
    if (criteria.responsibleMemberId && dataset.responsibleMemberId !== criteria.responsibleMemberId) return false;
    if (criteria.license && dataset.license !== criteria.license) return false;

    return true;
  });
}

export function validateDatasetLedger(datasets: Dataset[]): DatasetLedgerIssue[] {
  return datasets.flatMap((dataset) => validateDataset(dataset));
}

export function validateDataset(dataset: Dataset): DatasetLedgerIssue[] {
  const issues: DatasetLedgerIssue[] = [];

  if (dataset.status === 'unchecked') {
    issues.push({
      datasetId: dataset.id,
      field: 'status',
      severity: 'info',
      message: '未チェックのデータセットです。責任者による確認が必要です。',
    });
  }

  if (dataset.status === 'needs_action') {
    issues.push({
      datasetId: dataset.id,
      field: 'status',
      severity: 'warning',
      message: '要対応ステータスです。台帳情報を更新してください。',
    });
  }

  if (dataset.storageLocations.length === 0) {
    issues.push({
      datasetId: dataset.id,
      field: 'storageLocations',
      severity: 'warning',
      message: '保存場所が未設定です。パス・URL・外部IDのいずれかを登録してください。',
    });
  }

  if (dataset.storageLocations.length > 0 && dataset.storageLocations.every((location) => !location.hasBackup)) {
    issues.push({
      datasetId: dataset.id,
      field: 'storageLocations',
      severity: 'warning',
      message: 'バックアップ設定済みの保存場所がありません。',
    });
  }

  if (dataset.publicationStatus === 'open' && !dataset.publicUrl && !dataset.doi) {
    issues.push({
      datasetId: dataset.id,
      field: 'publicUrl',
      severity: 'warning',
      message: '公開可能なデータセットには公開URLまたはDOIを登録してください。',
    });
  }

  if (!dataset.license) {
    issues.push({
      datasetId: dataset.id,
      field: 'license',
      severity: 'warning',
      message: 'ライセンスが未設定です。',
    });
  }

  return issues;
}

export function getDatasetAttentionState(
  dataset: Dataset,
  issues: DatasetLedgerIssue[] = validateDataset(dataset),
): DatasetAttentionState {
  if (dataset.status === 'needs_action') return 'needs_action';
  if (issues.some((issue) => issue.severity === 'error' || issue.severity === 'warning')) return 'needs_action';
  if (dataset.status === 'unchecked' || issues.some((issue) => issue.severity === 'info')) return 'unchecked';

  return 'ready';
}

export function generateDatasetCsv(datasets: Dataset[]): string {
  const rows = datasets.map((dataset) => [
    dataset.id,
    dataset.projectId,
    dataset.name,
    dataset.description,
    dataset.dataType,
    dataset.generatedDate,
    dataset.lastUpdatedDate ?? '',
    dataset.version,
    dataset.status,
    dataset.createdBy,
    dataset.responsibleMemberId,
    dataset.publicationStatus,
    dataset.plannedPublicationDate ?? '',
    dataset.publicUrl ?? '',
    dataset.doi ?? '',
    dataset.license ?? '',
    dataset.usageTerms ?? '',
    dataset.citation ?? '',
    formatStorageLocationsForCsv(dataset.storageLocations),
  ]);

  return toCsv([[...datasetCsvColumns], ...rows]);
}

export function parseDatasetCsv(content: string): DatasetCsvImportResult {
  const rows = parseCsvRows(content);

  if (rows.length === 0) {
    return {
      datasets: [],
      errors: [{ rowNumber: 1, messages: ['CSVにヘッダー行がありません。'] }],
    };
  }

  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  const requiredColumns = [
    'id',
    'project_id',
    'name',
    'description',
    'data_type',
    'generated_date',
    'version',
    'status',
    'created_by',
    'responsible_member_id',
    'publication_status',
  ];
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return {
      datasets: [],
      errors: [
        {
          rowNumber: 1,
          messages: [`必須列が不足しています: ${missingColumns.join(', ')}`],
        },
      ],
    };
  }

  const datasets: Dataset[] = [];
  const errors: DatasetCsvImportError[] = [];

  for (const [index, row] of rows.slice(1).entries()) {
    if (row.every((cell) => cell.trim().length === 0)) continue;

    const rowNumber = index + 2;
    const record = toCsvRecord(headers, row);
    const candidate = {
      id: record.id,
      projectId: record.project_id,
      name: record.name,
      description: record.description,
      dataType: record.data_type,
      generatedDate: record.generated_date,
      lastUpdatedDate: emptyToUndefined(record.last_updated_date),
      version: record.version,
      status: record.status,
      createdBy: record.created_by,
      responsibleMemberId: record.responsible_member_id,
      storageLocations: parseStorageLocations(record.storage_locations),
      publicationStatus: record.publication_status,
      plannedPublicationDate: emptyToUndefined(record.planned_publication_date),
      publicUrl: emptyToUndefined(record.public_url),
      doi: emptyToUndefined(record.doi),
      license: emptyToUndefined(record.license),
      usageTerms: emptyToUndefined(record.usage_terms),
      citation: emptyToUndefined(record.citation),
    };
    const parsed = datasetSchema.safeParse(candidate);

    if (parsed.success) {
      datasets.push(parsed.data);
      continue;
    }

    errors.push({
      rowNumber,
      messages: parsed.error.issues.map((issue) => issue.message),
    });
  }

  return { datasets, errors };
}

function formatStorageLocationsForCsv(locations: StorageLocation[]): string {
  return locations
    .map((location) =>
      [
        location.label ?? '',
        location.uri,
        location.storageType,
        location.accessScope ?? '',
        location.hasBackup ? 'true' : 'false',
        location.isEncrypted ? 'true' : 'false',
      ].join('|'),
    )
    .join('; ');
}

function parseStorageLocations(value: string): StorageLocation[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  return trimmed.split(';').map((entry, index) => {
    const [labelOrUri = '', uriValue = '', storageTypeValue = '', accessScope = '', hasBackup = '', isEncrypted = ''] =
      entry.split('|').map((part) => part.trim());
    const hasExplicitLabel = uriValue.length > 0;
    const uri = hasExplicitLabel ? uriValue : labelOrUri;
    const label = hasExplicitLabel ? emptyToUndefined(labelOrUri) : undefined;

    return {
      id: `storage-${index + 1}`,
      label,
      uri,
      storageType: isOneOf(storageLocationTypeValues, storageTypeValue) ? storageTypeValue : 'other',
      accessScope: emptyToUndefined(accessScope),
      hasBackup: parseBoolean(hasBackup),
      isEncrypted: parseBoolean(isEncrypted),
    };
  });
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  row.push(cell);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);

  return rows;
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');

  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function toCsvRecord(headers: string[], row: string[]): Record<string, string> {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? '']));
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';

  return trimmed.length > 0 ? trimmed : undefined;
}

function parseBoolean(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? '';

  return ['true', '1', 'yes', 'y', 'あり', '有'].includes(normalized);
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T);
}
