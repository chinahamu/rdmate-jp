import { describe, expect, it } from 'vitest';
import { createDataset } from '../../src/domain/dataset';
import {
  assessPublicationDecision,
  createPublicationDecision,
  derivePublicationDecision,
  getLicenseCatalogItem,
  getPublicationReadiness,
  publicationLicenseCatalog,
  publicationStatusOptions,
  summarizePublicationDecisions,
} from '../../src/domain/publication-license';

const baseDataset = createDataset({
  id: 'dataset-1',
  projectId: 'project-1',
  name: '公開判断テストデータ',
  description: '公開判断チェックのテスト用データセット。',
  dataType: 'processed_data',
  generatedDate: '2026-04-01',
  lastUpdatedDate: '2026-04-05',
  version: '1.0.0',
  status: 'ready',
  createdBy: '山田 太郎',
  responsibleMemberId: 'member-data-steward',
  publicationStatus: 'open',
  publicUrl: 'https://example.ac.jp/dataset-1',
  license: 'CC BY 4.0',
  usageTerms: '出典表示を条件に利用可能。',
  storageLocations: [
    {
      id: 'storage-1',
      uri: 'https://storage.example.ac.jp/dataset-1',
      storageType: 'cloud_url',
      hasBackup: true,
      isEncrypted: true,
    },
  ],
});

describe('publication license domain', () => {
  it('lists all publication statuses and license candidates', () => {
    expect(publicationStatusOptions.map((option) => option.value)).toEqual([
      'open',
      'embargoed',
      'restricted',
      'closed',
      'undecided',
    ]);
    expect(publicationLicenseCatalog.map((license) => license.value)).toContain('CC0 1.0');
    expect(getLicenseCatalogItem('MIT')?.recommendedFor).toContain('ソースコード');
  });

  it('passes a complete open publication decision', () => {
    const decision = derivePublicationDecision(baseDataset);
    const issues = assessPublicationDecision(decision);

    expect(issues).toEqual([]);
    expect(getPublicationReadiness(issues)).toBe('ready');
  });

  it('warns when open data has PII possibility', () => {
    const decision = derivePublicationDecision(baseDataset, {
      containsPersonalInformation: true,
    });
    const issues = assessPublicationDecision(decision);

    expect(issues.some((issue) => issue.field === 'publicationStatus')).toBe(true);
    expect(getPublicationReadiness(issues)).toBe('needs_review');
  });

  it('requires planned publication date for embargoed data', () => {
    const decision = derivePublicationDecision(baseDataset, {
      publicationStatus: 'embargoed',
      plannedPublicationDate: undefined,
    });
    const issues = assessPublicationDecision(decision);

    expect(issues).toContainEqual({
      datasetId: baseDataset.id,
      field: 'plannedPublicationDate',
      severity: 'error',
      message: '一定期間後に公開する場合は公開予定日を入力してください。',
    });
    expect(getPublicationReadiness(issues)).toBe('blocked');
  });

  it('requires usage terms for restricted data and notes for agreement or patent cases', () => {
    const decision = derivePublicationDecision(baseDataset, {
      publicationStatus: 'restricted',
      usageTerms: undefined,
      hasCollaborativeAgreement: true,
      hasPatentPlan: true,
    });
    const issues = assessPublicationDecision(decision);

    expect(issues.map((issue) => issue.field)).toEqual([
      'usageTerms',
      'collaborativeAgreement',
      'patentPublicationNote',
    ]);
  });

  it('blocks closed data without non-publication reason', () => {
    const decision = derivePublicationDecision(baseDataset, {
      publicationStatus: 'closed',
      nonPublicationReason: undefined,
    });
    const issues = assessPublicationDecision(decision);

    expect(issues.some((issue) => issue.field === 'nonPublicationReason' && issue.severity === 'error')).toBe(true);
    expect(getPublicationReadiness(issues)).toBe('blocked');
  });

  it('summarizes publication decisions', () => {
    const decisions = [
      derivePublicationDecision(baseDataset),
      createPublicationDecision({ datasetId: 'dataset-2', publicationStatus: 'undecided' }),
      createPublicationDecision({ datasetId: 'dataset-3', publicationStatus: 'closed' }),
    ];
    const summary = summarizePublicationDecisions(decisions);

    expect(summary.total).toBe(3);
    expect(summary.countsByStatus.open).toBe(1);
    expect(summary.countsByStatus.undecided).toBe(1);
    expect(summary.blocked).toBe(1);
  });
});
