import { describe, expect, it } from 'vitest';
import {
  createDataset,
  datasetCsvColumns,
  filterDatasets,
  generateDatasetCsv,
  getDatasetAttentionState,
  parseDatasetCsv,
  validateDatasetLedger,
} from '../../src/domain/dataset';

const baseDataset = {
  id: 'dataset-1',
  projectId: 'project-1',
  name: 'RNA-seq raw reads',
  description: 'RNA-seqのFASTQファイル一式。',
  dataType: 'experimental_data' as const,
  generatedDate: '2026-04-01',
  lastUpdatedDate: '2026-04-10',
  version: '1.0.0',
  status: 'ready' as const,
  createdBy: '山田 太郎',
  responsibleMemberId: 'member-data-steward',
  storageLocations: [
    {
      id: 'storage-1',
      label: 'GakuNin RDM',
      uri: 'https://rdm.example.ac.jp/projects/project-1/datasets/rnaseq',
      storageType: 'gakunin_rdm_url' as const,
      accessScope: '研究チーム',
      hasBackup: true,
      isEncrypted: true,
    },
    {
      id: 'storage-2',
      label: '研究室NAS',
      uri: '/mnt/lab/rnaseq/raw',
      storageType: 'network_drive' as const,
      accessScope: '研究室内',
      hasBackup: false,
      isEncrypted: false,
    },
  ],
  publicationStatus: 'open' as const,
  plannedPublicationDate: '2027-04-01',
  publicUrl: 'https://repository.example.ac.jp/datasets/rnaseq',
  doi: '10.1234/example.rnaseq.2026',
  license: 'CC BY 4.0' as const,
  usageTerms: '研究目的で再利用可能。',
  citation: 'Yamada et al. (2026) RNA-seq raw reads.',
};

describe('dataset ledger domain', () => {
  it('creates a dataset with publication metadata and multiple storage locations', () => {
    const dataset = createDataset(baseDataset);

    expect(dataset.name).toBe('RNA-seq raw reads');
    expect(dataset.storageLocations).toHaveLength(2);
    expect(dataset.publicationStatus).toBe('open');
    expect(dataset.license).toBe('CC BY 4.0');
  });

  it('validates dates and embargoed publication requirements', () => {
    expect(() =>
      createDataset({
        ...baseDataset,
        lastUpdatedDate: '2026-03-31',
      }),
    ).toThrow('更新日はデータ取得/生成日以降にしてください。');

    expect(() =>
      createDataset({
        ...baseDataset,
        publicationStatus: 'embargoed',
        plannedPublicationDate: undefined,
      }),
    ).toThrow('一定期間後に公開する場合は公開予定日を入力してください。');
  });

  it('filters by project, status, publication status, responsible member, and license', () => {
    const readyDataset = createDataset(baseDataset);
    const restrictedDataset = createDataset({
      ...baseDataset,
      id: 'dataset-2',
      name: '匿名化済み回答データ',
      dataType: 'survey_data',
      status: 'needs_action',
      publicationStatus: 'restricted',
      responsibleMemberId: 'member-pi',
      license: 'Custom / Not specified',
    });

    const filtered = filterDatasets([readyDataset, restrictedDataset], {
      status: 'needs_action',
      publicationStatus: 'restricted',
      responsibleMemberId: 'member-pi',
      license: 'Custom / Not specified',
    });

    expect(filtered.map((dataset) => dataset.id)).toEqual(['dataset-2']);
  });

  it('reports missing storage, missing license, and open datasets without a URL or DOI', () => {
    const dataset = createDataset({
      ...baseDataset,
      storageLocations: [],
      publicUrl: undefined,
      doi: undefined,
      license: undefined,
    });
    const issues = validateDatasetLedger([dataset]);

    expect(issues.map((issue) => issue.field)).toEqual([
      'storageLocations',
      'publicUrl',
      'license',
    ]);
    expect(getDatasetAttentionState(dataset, issues)).toBe('needs_action');
  });

  it('exports and imports dataset CSV', () => {
    const dataset = createDataset(baseDataset);
    const csv = generateDatasetCsv([dataset]);
    const result = parseDatasetCsv(csv);

    expect(csv.startsWith(datasetCsvColumns.join(','))).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.datasets[0]?.name).toBe(dataset.name);
    expect(result.datasets[0]?.storageLocations[0]?.uri).toBe(dataset.storageLocations[0]?.uri);
  });

  it('returns row-level errors for invalid CSV values', () => {
    const csv = [
      datasetCsvColumns.join(','),
      'dataset-1,project-1,Invalid,Invalid description,unknown_type,2026-04-01,,1.0.0,ready,山田 太郎,member-1,open,,,,,,,',
    ].join('\n');
    const result = parseDatasetCsv(csv);

    expect(result.datasets).toEqual([]);
    expect(result.errors[0]?.rowNumber).toBe(2);
    expect(result.errors[0]?.messages.length).toBeGreaterThan(0);
  });
});
