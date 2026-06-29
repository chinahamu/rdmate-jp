import { z } from 'zod';
import type { Dataset, StorageLocation } from './dataset';

const urlStorageTypes = ['cloud_url', 'gakunin_rdm_url', 'github_url', 'external_repository'] as const;
const localStorageTypes = ['local_path', 'network_drive'] as const;
const relativePathSchema = z.string().min(1, '相対パスは必須です。');
const hashAlgorithmValues = ['sha256', 'sha512', 'md5', 'none'] as const;

export type StorageReferenceIssueSeverity = 'error' | 'warning' | 'info';

export type StorageReferenceIssue = Readonly<{
  datasetId: string;
  locationId?: string;
  manifestEntryId?: string;
  field: string;
  severity: StorageReferenceIssueSeverity;
  message: string;
}>;

export type LocalPathExistenceChecker = (path: string, location: StorageLocation, dataset: Dataset) => boolean;

export type StorageReferenceValidationOptions = Readonly<{
  localPathExists?: LocalPathExistenceChecker;
  importantDatasetStatuses?: readonly Dataset['status'][];
}>;

export const fileManifestEntrySchema = z
  .object({
    id: z.string().min(1),
    datasetId: z.string().min(1),
    fileName: z.string().min(1, 'ファイル名は必須です。'),
    relativePath: relativePathSchema,
    sizeBytes: z.number().int().nonnegative('ファイルサイズは0以上の整数で入力してください。'),
    hashAlgorithm: z.enum(hashAlgorithmValues).default('none'),
    hashValue: z.string().min(1).optional(),
    mimeType: z.string().min(1, 'MIMEタイプは必須です。'),
    modifiedAt: z.string().datetime('更新日時はISO 8601形式で入力してください。'),
    storageLocationId: z.string().min(1).optional(),
  })
  .superRefine((entry, context) => {
    if (entry.hashAlgorithm !== 'none' && !entry.hashValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hashValue'],
        message: 'ハッシュ値を入力してください。',
      });
    }

    if (entry.hashAlgorithm === 'none' && entry.hashValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hashAlgorithm'],
        message: 'ハッシュ値がある場合はハッシュ方式を指定してください。',
      });
    }
  });

export type FileManifestEntryInput = z.input<typeof fileManifestEntrySchema>;
export type FileManifestEntry = z.infer<typeof fileManifestEntrySchema>;

export type DatasetManifest = Readonly<{
  datasetId: string;
  entries: FileManifestEntry[];
}>;

export const manifestCsvColumns = [
  'dataset_id',
  'file_name',
  'relative_path',
  'size_bytes',
  'hash_algorithm',
  'hash_value',
  'mime_type',
  'modified_at',
  'storage_location_id',
] as const;

export function createFileManifestEntry(input: FileManifestEntryInput): FileManifestEntry {
  return fileManifestEntrySchema.parse(input);
}

export function validateStorageReferences(
  datasets: Dataset[],
  options: StorageReferenceValidationOptions = {},
): StorageReferenceIssue[] {
  return datasets.flatMap((dataset) => validateDatasetStorageReferences(dataset, options));
}

export function validateDatasetStorageReferences(
  dataset: Dataset,
  options: StorageReferenceValidationOptions = {},
): StorageReferenceIssue[] {
  const issues: StorageReferenceIssue[] = [];
  const importantStatuses = options.importantDatasetStatuses ?? ['ready', 'published', 'needs_action'];

  if (dataset.storageLocations.length === 0) {
    issues.push({
      datasetId: dataset.id,
      field: 'storageLocations',
      severity: 'warning',
      message: '保存場所が未設定です。所在情報を少なくとも1件登録してください。',
    });
    return issues;
  }

  for (const location of dataset.storageLocations) {
    issues.push(...validateStorageLocation(dataset, location, options));
  }

  if (
    importantStatuses.includes(dataset.status) &&
    dataset.storageLocations.every((location) => !location.hasBackup)
  ) {
    issues.push({
      datasetId: dataset.id,
      field: 'storageLocations.hasBackup',
      severity: 'warning',
      message: '重要データセットですが、バックアップ有りの保存場所がありません。',
    });
  }

  return issues;
}

export function validateStorageLocation(
  dataset: Dataset,
  location: StorageLocation,
  options: StorageReferenceValidationOptions = {},
): StorageReferenceIssue[] {
  const issues: StorageReferenceIssue[] = [];

  if (isUrlStorageLocation(location) && !isValidUrl(location.uri)) {
    issues.push({
      datasetId: dataset.id,
      locationId: location.id,
      field: 'uri',
      severity: 'error',
      message: 'URL形式が正しくありません。',
    });
  }

  if (location.storageType === 'github_url' && isValidUrl(location.uri) && !isGitHubUrl(location.uri)) {
    issues.push({
      datasetId: dataset.id,
      locationId: location.id,
      field: 'uri',
      severity: 'warning',
      message: 'GitHub URLとして登録されていますが、github.com のURLではありません。',
    });
  }

  if (isLocalStorageLocation(location)) {
    if (!isLikelyLocalOrNetworkPath(location.uri)) {
      issues.push({
        datasetId: dataset.id,
        locationId: location.id,
        field: 'uri',
        severity: 'warning',
        message: 'ローカル/ネットワークパスとして解釈しにくい形式です。',
      });
    }

    if (options.localPathExists && !options.localPathExists(location.uri, location, dataset)) {
      issues.push({
        datasetId: dataset.id,
        locationId: location.id,
        field: 'uri',
        severity: 'warning',
        message: 'ローカルパスの存在を確認できませんでした。',
      });
    }
  }

  if (!location.accessScope) {
    issues.push({
      datasetId: dataset.id,
      locationId: location.id,
      field: 'accessScope',
      severity: 'info',
      message: 'アクセス範囲が未設定です。',
    });
  }

  if (!location.hasBackup) {
    issues.push({
      datasetId: dataset.id,
      locationId: location.id,
      field: 'hasBackup',
      severity: 'info',
      message: 'この保存場所はバックアップ未設定です。',
    });
  }

  if (!location.isEncrypted && ['cloud_url', 'gakunin_rdm_url', 'external_repository'].includes(location.storageType)) {
    issues.push({
      datasetId: dataset.id,
      locationId: location.id,
      field: 'isEncrypted',
      severity: 'info',
      message: '暗号化有無を確認してください。',
    });
  }

  return issues;
}

export function validateFileManifest(
  dataset: Pick<Dataset, 'id' | 'storageLocations'>,
  entries: FileManifestEntry[],
): StorageReferenceIssue[] {
  const issues: StorageReferenceIssue[] = [];
  const storageLocationIds = new Set(dataset.storageLocations.map((location) => location.id));

  for (const entry of entries) {
    if (entry.datasetId !== dataset.id) {
      issues.push({
        datasetId: dataset.id,
        manifestEntryId: entry.id,
        field: 'datasetId',
        severity: 'error',
        message: 'マニフェスト行のdatasetIdが対象データセットと一致しません。',
      });
    }

    if (entry.relativePath.startsWith('/') || /^[a-z]:[\\/]/i.test(entry.relativePath)) {
      issues.push({
        datasetId: dataset.id,
        manifestEntryId: entry.id,
        field: 'relativePath',
        severity: 'error',
        message: 'ファイルマニフェストには絶対パスではなく相対パスを登録してください。',
      });
    }

    if (entry.storageLocationId && !storageLocationIds.has(entry.storageLocationId)) {
      issues.push({
        datasetId: dataset.id,
        manifestEntryId: entry.id,
        field: 'storageLocationId',
        severity: 'warning',
        message: '存在しない保存場所IDが指定されています。',
      });
    }
  }

  return issues;
}

export function generateManifestJson(manifest: DatasetManifest): string {
  return `${JSON.stringify({ schemaVersion: '1.0.0', ...manifest }, null, 2)}\n`;
}

export function generateManifestCsv(entries: FileManifestEntry[]): string {
  const rows = entries.map((entry) => [
    entry.datasetId,
    entry.fileName,
    entry.relativePath,
    String(entry.sizeBytes),
    entry.hashAlgorithm,
    entry.hashValue ?? '',
    entry.mimeType,
    entry.modifiedAt,
    entry.storageLocationId ?? '',
  ]);

  return toCsv([[...manifestCsvColumns], ...rows]);
}

export function getManifestFileName(dataset: Pick<Dataset, 'id' | 'name'>, extension: 'csv' | 'json') {
  return `${slugify(dataset.name || dataset.id)}_manifest.${extension}`;
}

function isUrlStorageLocation(location: StorageLocation): boolean {
  return (urlStorageTypes as readonly string[]).includes(location.storageType);
}

function isLocalStorageLocation(location: StorageLocation): boolean {
  return (localStorageTypes as readonly string[]).includes(location.storageType);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isGitHubUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === 'github.com' || url.hostname.endsWith('.github.com');
  } catch {
    return false;
  }
}

function isLikelyLocalOrNetworkPath(value: string): boolean {
  return (
    value.startsWith('/') ||
    value.startsWith('~/') ||
    value.startsWith('\\\\') ||
    /^[a-z]:[\\/]/i.test(value)
  );
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');

  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9ー\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 80);
}
