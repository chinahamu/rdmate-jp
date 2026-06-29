import { describe, expect, it } from 'vitest';
import {
  createDmpDiffReport,
  extractDmpDatasetPolicy,
  generateDmpDiffCsv,
  generateDmpDiffMarkdown,
  validateDmpDatasetDiff,
} from '../../src/domain/dmp-diff';
import { getSampleDatasets } from '../../src/server/sample-datasets';
import { getSampleDmpDiffContext, getSampleDmpDiffReport } from '../../src/server/sample-dmp-diff';

describe('DMP diff check domain', () => {
  it('extracts comparison policy from DMP answers', () => {
    const context = getSampleDmpDiffContext();
    const policy = extractDmpDatasetPolicy(context);

    expect(policy.plannedDataTypes).toEqual(['survey_data', 'source_code']);
    expect(policy.storageKeywords).toEqual(['大学提供クラウド', 'クラウド', 'GitHub']);
    expect(policy.publicationStatuses).toEqual(['restricted']);
    expect(policy.retentionPolicy).toBe('研究終了後5年間');
    expect(policy.responsibleParties).toContain('佐藤 花子');
  });

  it('detects DMP and Dataset differences with target classification', () => {
    const context = getSampleDmpDiffContext();
    const datasets = getSampleDatasets();
    const policy = extractDmpDatasetPolicy(context);
    const issues = validateDmpDatasetDiff(context, datasets, policy);

    expect(issues.some((issue) => issue.field === 'dataType' && issue.actionTarget === 'dmp_update')).toBe(true);
    expect(issues.some((issue) => issue.field === 'storageLocations' && issue.severity === 'error')).toBe(true);
    expect(issues.some((issue) => issue.field === 'publicationStatus' && issue.actionTarget === 'dataset_update')).toBe(true);
    expect(issues.some((issue) => issue.field === 'responsibleMemberId')).toBe(true);
    expect(issues.some((issue) => issue.field === 'disposalPolicy' && issue.actionTarget === 'dmp_update')).toBe(true);
  });

  it('creates project-level report summary', () => {
    const report = getSampleDmpDiffReport();

    expect(report.schemaVersion).toBe('1.0.0');
    expect(report.summary.errorCount).toBeGreaterThanOrEqual(1);
    expect(report.summary.warningCount).toBeGreaterThanOrEqual(1);
    expect(report.summary.dmpUpdateCount).toBeGreaterThanOrEqual(1);
    expect(report.summary.datasetUpdateCount).toBeGreaterThanOrEqual(1);
  });

  it('exports Markdown and CSV reports', () => {
    const report = createDmpDiffReport(getSampleDmpDiffContext(), getSampleDatasets());
    const markdown = generateDmpDiffMarkdown(report);
    const csv = generateDmpDiffCsv(report);

    expect(markdown).toContain('# DMP差分レポート');
    expect(markdown).toContain('DMP更新候補');
    expect(csv).toContain('id,project_id,dataset_id');
    expect(csv).toContain('action_target');
  });
});
