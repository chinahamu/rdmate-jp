import { describe, expect, it } from 'vitest';
import { createDataset } from '../../src/domain/dataset';
import {
  createFileManifestEntry,
  generateManifestCsv,
  generateManifestJson,
  manifestCsvColumns,
  validateFileManifest,
  validateStorageReferences,
} from '../../src/domain/storage-reference';

const baseDataset = createDataset({
  id: 'dataset-1',
  projectId: 'project-1',
  name: '画像データセット',
  description: '顕微鏡画像のメタデータ参照。',
  dataType: 'image_video',
  generatedDate: '2026-04-01',
  lastUpdatedDate: '2026-04-05',
  version: '1.0.0',
  status: 'ready',
  createdBy: '山田 太郎',
  responsibleMemberId: 'member-data-steward',
  publicationStatus: 'restricted',
  license: 'Custom / Not specified',
  storageLocations: [
    {
      id: 'storage-gakunin',
      label: 'GakuNin RDM',
      uri: 'https://rdm.example.ac.jp/projects/project-1/datasets/images',
      storageType: 'gakunin_rdm_url',
      accessScope: '研究チーム',
      hasBackup: true,
      isEncrypted: true,
    },
    {
      id: 'storage-local',
      label: '研究室NAS',
      uri: '/mnt/lab/images',
      storageType: 'network_drive',
      accessScope: '研究室内',
      hasBackup: false,
      isEncrypted: false,
    },
  ],
});

describe('storage reference domain', () => {
  it('accepts valid URL and local path storage references', () => {
    const issues = validateStorageReferences([baseDataset], {
      localPathExists: (path) => path === '/mnt/lab/images',
    });

    expect(issues.filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('validates URL formats and optional local path existence checks', () => {
    const dataset = createDataset({
      ...baseDataset,
      storageLocations: [
        {
          id: 'storage-cloud',
          uri: 'not-a-url',
          storageType: 'cloud_url',
          hasBackup: false,
          isEncrypted: false,
        },
        {
          id: 'storage-local',
          uri: '/missing/path',
          storageType: 'local_path',
          hasBackup: false,
          isEncrypted: false,
        },
      ],
    });
    const issues = validateStorageReferences([dataset], {
      localPathExists: () => false,
    });

    expect(issues.some((issue) => issue.message === 'URL形式が正しくありません。')).toBe(true);
    expect(issues.some((issue) => issue.message === 'ローカルパスの存在を確認できませんでした。')).toBe(true);
    expect(issues.some((issue) => issue.message === '重要データセットですが、バックアップ有りの保存場所がありません。')).toBe(true);
  });

  it('detects datasets without storage locations', () => {
    const dataset = createDataset({
      ...baseDataset,
      storageLocations: [],
    });
    const issues = validateStorageReferences([dataset]);

    expect(issues).toEqual([
      {
        datasetId: dataset.id,
        field: 'storageLocations',
        severity: 'warning',
        message: '保存場所が未設定です。所在情報を少なくとも1件登録してください。',
      },
    ]);
  });

  it('creates metadata-only file manifest entries and exports CSV/JSON', () => {
    const entry = createFileManifestEntry({
      id: 'manifest-1',
      datasetId: baseDataset.id,
      fileName: 'image-001.tif',
      relativePath: 'raw/image-001.tif',
      sizeBytes: 1048576,
      hashAlgorithm: 'sha256',
      hashValue: 'a6f2d7337d3f2c65f1674f6ed9ed60d7bb02d7aa9f1e03dd9cf8a2079e7d85ce',
      mimeType: 'image/tiff',
      modifiedAt: '2026-04-05T10:00:00.000Z',
      storageLocationId: 'storage-gakunin',
    });
    const csv = generateManifestCsv([entry]);
    const json = generateManifestJson({ datasetId: baseDataset.id, entries: [entry] });

    expect(csv.startsWith(manifestCsvColumns.join(','))).toBe(true);
    expect(json).toContain('"schemaVersion": "1.0.0"');
    expect(json).toContain('image-001.tif');
  });

  it('validates manifest relative paths and storage location ids', () => {
    const entry = createFileManifestEntry({
      id: 'manifest-1',
      datasetId: baseDataset.id,
      fileName: 'image-001.tif',
      relativePath: '/absolute/image-001.tif',
      sizeBytes: 1048576,
      hashAlgorithm: 'none',
      mimeType: 'image/tiff',
      modifiedAt: '2026-04-05T10:00:00.000Z',
      storageLocationId: 'missing-storage',
    });
    const issues = validateFileManifest(baseDataset, [entry]);

    expect(issues.map((issue) => issue.field)).toEqual(['relativePath', 'storageLocationId']);
  });
});
