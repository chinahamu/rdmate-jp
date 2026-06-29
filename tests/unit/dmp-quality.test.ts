import { describe, expect, it } from 'vitest';
import {
  applyProjectAutofill,
  getFieldId,
  type DmpAnswerMap,
} from '../../src/domain/dmp-answer';
import {
  createBasicQualityIssues,
  createDmpQualityReport,
  createRiskQualityIssues,
  getExportDecisionMessage,
} from '../../src/domain/dmp-quality';
import { createResearchMember } from '../../src/domain/research-member';
import { createResearchProject } from '../../src/domain/research-project';
import { getSampleDmpExportContext } from '../../src/server/dmp-export-sample';

describe('DMP quality checks', () => {
  it('detects missing basic items', () => {
    const context = getSampleDmpExportContext();
    const answers: DmpAnswerMap = {
      ...context.answers,
      [getFieldId('storage_and_sharing', 'storage_location')]: '',
      [getFieldId('storage_and_sharing', 'sharing_policy')]: '',
      [getFieldId('storage_and_sharing', 'retention_period')]: '',
    };

    const issues = createBasicQualityIssues(context.template, context.project, answers);
    const titles = issues.map((issue) => issue.title);

    expect(titles).toContain('保存場所未設定');
    expect(titles).toContain('公開区分未設定');
    expect(titles).toContain('保持期間未設定');
    expect(titles).toContain('ライセンス未設定');
  });

  it('detects sensitive data, external sharing, and commercialization risks', () => {
    const context = getSampleDmpExportContext();
    const externalMember = createResearchMember({
      id: 'external-member',
      name: '外部 共同研究者',
      affiliation: '外部研究機関',
      role: 'EXTERNAL_COLLABORATOR',
      email: 'external@example.org',
    });
    const project = createResearchProject({
      ...context.project,
      members: [...context.project.members, externalMember],
    });
    const answers = {
      ...applyProjectAutofill(context.template, project),
      [getFieldId('data_description', 'data_types')]: '患者の医療データと特許出願予定の分析コード',
    };

    const issues = createRiskQualityIssues(context.template, project, answers);

    expect(issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(['risk.sensitive_data', 'risk.external_sharing', 'risk.commercialization']),
    );
  });

  it('summarizes export decision by severity', () => {
    const context = getSampleDmpExportContext();
    const report = createDmpQualityReport(context.template, context.project, {
      ...context.answers,
      [getFieldId('storage_and_sharing', 'storage_location')]: '',
    });

    expect(report.summary.errorCount).toBeGreaterThan(0);
    expect(report.summary.canExport).toBe(false);
    expect(getExportDecisionMessage(report.summary, false)).toContain('エラーが残っている');
  });
});
