import { describe, expect, it } from 'vitest';
import jpFunderRuleSet from '../../rules/funders/dmp-check-rules.json';
import type { DmpAnswerMap } from '../../src/domain/dmp-answer';
import {
  createFunderCheckMarkdownReport,
  createFunderCheckPdfReport,
  evaluateFunderCheckRules,
  validateFunderCheckRuleSet,
} from '../../src/domain/funder-check-rule';
import { getSampleFunderCheckContext } from '../../src/server/funder-check-rules';
import { getDmpTemplateById } from '../../src/server/template-registry';

describe('funder-specific check rules', () => {
  it('validates JSON-defined required, recommended, conditional, and forbidden rules', () => {
    const ruleSet = validateFunderCheckRuleSet(jpFunderRuleSet);

    expect(ruleSet.id).toBe('jp-funder-basic-v1');
    expect(ruleSet.rules.map((rule) => rule.type)).toEqual(
      expect.arrayContaining(['required', 'recommended', 'conditional', 'forbidden']),
    );
    expect(ruleSet.rules.find((rule) => rule.id === 'conditional.personal-data-controls')?.conditionMode).toBe('any');
  });

  it('scores a sample Japanese funder DMP and includes reviewer comment prompts', () => {
    const context = getSampleFunderCheckContext();
    const report = evaluateFunderCheckRules(jpFunderRuleSet, context, 'ja', '2026-06-29T00:00:00.000Z');

    expect(report.ruleSetId).toBe('jp-funder-basic-v1');
    expect(report.summary.score).toBeGreaterThanOrEqual(0);
    expect(report.summary.score).toBeLessThanOrEqual(100);
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.reviewCommentPrompts.some((prompt) => prompt.role === 'ura')).toBe(true);
    expect(report.reviewCommentPrompts.some((prompt) => prompt.role === 'library')).toBe(true);
  });

  it('requires consent, anonymization, and access control when personal data is detected', () => {
    const template = getDmpTemplateById('human-subjects-jp-v1');
    const context = getSampleFunderCheckContext();

    if (!template) throw new Error('template missing');

    const answers: DmpAnswerMap = {
      'ethics.human_subject_applicability': '該当する',
      'ethics.ethics_review_status': '申請中',
      'ethics.consent_scope': '',
      'privacy.personal_data_types': '患者の個人情報を含む。',
      'privacy.anonymization_method': '',
      'privacy.access_control': '',
      'sharing.sharing_policy': '制限付き公開',
    };

    const report = evaluateFunderCheckRules(jpFunderRuleSet, { ...context, template, answers });
    const personalDataResult = report.results.find((result) => result.ruleId === 'conditional.personal-data-controls');

    expect(personalDataResult?.status).toBe('failed');
    expect(personalDataResult?.severity).toBe('error');
    expect(personalDataResult?.violations.length).toBeGreaterThanOrEqual(3);
  });

  it('requires a reason and alternative public output for restricted data', () => {
    const template = getDmpTemplateById('generic-jp-v2');
    const context = getSampleFunderCheckContext();

    if (!template) throw new Error('template missing');

    const report = evaluateFunderCheckRules(jpFunderRuleSet, {
      ...context,
      template,
      answers: {
        'data_description.data_types': '実験データ',
        'data_description.metadata_standards': '',
        'storage_and_sharing.storage_locations': ['研究室サーバ'],
        'storage_and_sharing.sharing_policy': '非公開',
        'storage_and_sharing.private_reason': '',
        'responsibility.data_manager': '佐藤 花子',
      },
    });

    const privateDataResult = report.results.find((result) => result.ruleId === 'conditional.private-data-alternative-output');

    expect(privateDataResult?.status).toBe('failed');
    expect(privateDataResult?.message).toContain('非公開理由');
  });

  it('exports Markdown and PDF review reports', () => {
    const report = evaluateFunderCheckRules(jpFunderRuleSet, getSampleFunderCheckContext());
    const markdown = createFunderCheckMarkdownReport(report);
    const pdf = createFunderCheckPdfReport(report);

    expect(markdown).toContain('# 助成機関別DMPチェックレポート');
    expect(markdown).toContain('URA・図書館担当者向けコメント欄');
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('%%EOF');
  });
});
