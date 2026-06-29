import { describe, expect, it } from 'vitest';
import {
  createDataset,
  generateDatasetCsv,
  parseDatasetCsv,
  validateDatasetLedger,
} from '../../src/domain/dataset';
import {
  assessPublicationDecision,
  createPublicationDecision,
  getPublicationReadiness,
} from '../../src/domain/publication-license';
import {
  createDmpDiffReport,
  extractDmpDatasetPolicy,
} from '../../src/domain/dmp-diff';
import {
  toDataCiteMetadata,
  validateRepositoryMetadata,
} from '../../src/domain/metadata';
import {
  createRepositoryCsvExport,
  previewDatasetCsvImport,
} from '../../src/domain/import-export';
import { getSampleDmpDiffContext } from '../../src/server/sample-dmp-diff';
import { getSampleDatasets } from '../../src/server/sample-datasets';
import { getSampleDatasetMetadata } from '../../src/server/sample-metadata';
import { getSampleManifestEntries } from '../../src/server/sample-storage-reference';
import { getSampleRelatedOutputs } from '../../src/server/sample-related-outputs';

const baseDataset = {
  id: 'dataset-test-plan',
  projectId: 'project-rdmate-demo',
  name: 'テスト計画用データセット',
  description: 'Phase 2テスト計画のDataset作成・更新バリデーション確認用。',
  dataType: 'survey_data' as const,
  generatedDate: '2026-06-01',
  lastUpdatedDate: '2026-06-10',
  version: '1.0.0',
  status: 'ready' as const,
  createdBy: '佐藤 花子',
  responsibleMemberId: 'member-data-steward',
  storageLocations: [
    {
      id: 'storage-test-plan',
      label: '大学提供クラウド',
      uri: 'https://storage.example.ac.jp/rdmate/test-plan',
      storageType: 'cloud_url' as const,
      accessScope: '研究チーム',
      hasBackup: true,
      isEncrypted: true,
    },
  ],
  publicationStatus: 'restricted' as const,
  plannedPublicationDate: '2027-04-30',
  license: 'Custom / Not specified' as const,
  usageTerms: '匿名化済み集計データのみ申請制で共有する。',
  citation: 'RDMate JP 実証研究チーム (2026) テスト計画用データセット.',
};

describe('Phase 2 test plan coverage', () => {
  it('covers Dataset creation and update validation', () => {
    const dataset = createDataset(baseDataset);
    expect(dataset.id).toBe('dataset-test-plan');
    expect(validateDatasetLedger([dataset])).toEqual([]);

    expect(() =>
      createDataset({
        ...baseDataset,
        lastUpdatedDate: '2026-05-31',
      }),
    ).toThrow('更新日はデータ取得/生成日以降にしてください。');
  });

  it('covers publication status and non-public reason consistency', () => {
    const missingReason = createPublicationDecision({
      datasetId: baseDataset.id,
      publicationStatus: 'closed',
      license: 'Custom / Not specified',
    });
    const blockedIssues = assessPublicationDecision(missingReason);

    expect(blockedIssues).toContainEqual({
      datasetId: baseDataset.id,
      field: 'nonPublicationReason',
      severity: 'error',
      message: '非公開の場合は非公開理由を入力してください。',
    });
    expect(getPublicationReadiness(blockedIssues)).toBe('blocked');

    const withReason = createPublicationDecision({
      datasetId: baseDataset.id,
      publicationStatus: 'closed',
      nonPublicationReason: '個人情報と共同研究契約上の制約により公開しない。',
      license: 'Custom / Not specified',
    });
    expect(assessPublicationDecision(withReason).some((issue) => issue.field === 'nonPublicationReason')).toBe(false);
  });

  it('covers DMP difference check for project-level report', () => {
    const context = getSampleDmpDiffContext();
    const datasets = getSampleDatasets();
    const policy = extractDmpDatasetPolicy(context);
    const report = createDmpDiffReport(context, datasets);

    expect(policy.plannedDataTypes).toEqual(['survey_data', 'source_code']);
    expect(report.summary.errorCount).toBeGreaterThanOrEqual(1);
    expect(report.issues.some((issue) => issue.actionTarget === 'dmp_update')).toBe(true);
    expect(report.issues.some((issue) => issue.actionTarget === 'dataset_update')).toBe(true);
  });

  it('covers DataCite-like metadata conversion and repository-field validation', () => {
    const datasets = getSampleDatasets();
    const metadataList = getSampleDatasetMetadata();
    const dataset = datasets.find((candidate) => candidate.id === 'dataset-user-test-raw');
    const metadata = metadataList.find((candidate) => candidate.datasetId === 'dataset-user-test-raw');

    if (!dataset || !metadata) throw new Error('Sample dataset metadata is not available.');

    const dataCite = toDataCiteMetadata(metadata, dataset);
    expect(dataCite.titles[0]?.title).toBe(dataset.name);
    expect(dataCite.creators[0]?.name).toBe('佐藤 花子');
    expect(dataCite.resourceType.resourceTypeGeneral).toBe('Dataset');
    expect(validateRepositoryMetadata(metadata)).toEqual([]);

    const repositoryCsv = createRepositoryCsvExport(
      datasets,
      metadataList,
      getSampleManifestEntries(),
      getSampleRelatedOutputs(),
      'JST 研究データ管理支援プログラム JPMJRD2026',
    );
    expect(repositoryCsv.csv).toContain('dataset_id,title,creators,description');
  });

  it('covers CSV import validation and duplicate detection', () => {
    const [first, second] = getSampleDatasets();
    if (!first || !second) throw new Error('Sample datasets are not available.');

    const csv = generateDatasetCsv([
      { ...first, id: 'dataset-import-test-1', name: '重複Dataset', doi: '10.1234/phase2.test' },
      { ...second, id: 'dataset-import-test-2', name: '重複Dataset', doi: '10.1234/phase2.test' },
    ]);
    const preview = previewDatasetCsvImport(csv);
    const parsed = parseDatasetCsv(csv);

    expect(parsed.errors).toEqual([]);
    expect(preview.totalRows).toBe(2);
    expect(preview.issues.some((issue) => issue.field === 'name' && issue.severity === 'error')).toBe(true);
    expect(preview.issues.some((issue) => issue.field === 'doi' && issue.severity === 'error')).toBe(true);
  });
});
