import jpFunderRuleSet from '../../rules/funders/dmp-check-rules.json';
import type { DmpAnswerMap } from '../domain/dmp-answer';
import {
  createFunderCheckMarkdownReport,
  createFunderCheckPdfReport,
  evaluateFunderCheckRules,
  validateFunderCheckRuleSet,
  type FunderCheckLocale,
  type FunderCheckReport,
  type FunderCheckRuleSet,
} from '../domain/funder-check-rule';
import { getSampleResearchProject } from './sample-project';
import { getDmpTemplateById } from './template-registry';

const ruleSets = [validateFunderCheckRuleSet(jpFunderRuleSet)];

export function listFunderCheckRuleSets(): FunderCheckRuleSet[] {
  return ruleSets;
}

export function getFunderCheckRuleSetById(ruleSetId: string): FunderCheckRuleSet | undefined {
  return ruleSets.find((ruleSet) => ruleSet.id === ruleSetId);
}

export function getDefaultFunderCheckRuleSetId(): string {
  return 'jp-funder-basic-v1';
}

export function createSampleFunderCheckReport(locale: FunderCheckLocale = 'ja'): FunderCheckReport {
  const context = getSampleFunderCheckContext();
  const ruleSet = getFunderCheckRuleSetById(getDefaultFunderCheckRuleSetId());

  if (!ruleSet) {
    throw new Error('Funder check rule set not found.');
  }

  return evaluateFunderCheckRules(ruleSet, context, locale, '2026-06-29T00:00:00.000Z');
}

export function createSampleFunderCheckMarkdownReport(locale: FunderCheckLocale = 'ja'): string {
  return createFunderCheckMarkdownReport(createSampleFunderCheckReport(locale), locale);
}

export function createSampleFunderCheckPdfReport(locale: FunderCheckLocale = 'ja'): string {
  return createFunderCheckPdfReport(createSampleFunderCheckReport(locale), locale);
}

export function getSampleFunderCheckContext() {
  const project = getSampleResearchProject();
  const template = getDmpTemplateById('japanese-funder-jp-v1');

  if (!template) {
    throw new Error('DMP template not found.');
  }

  const answers: DmpAnswerMap = {
    'funder_context.funder_name': '科研費',
    'funder_context.grant_number': project.funding[0]?.projectNumber ?? '',
    'funder_context.data_policy_requirements': '研究開始時にDMPを作成し、研究成果公開時にメタデータを更新する。',
    'data_management.managed_data': 'DMP入力ログ、利用者アンケート、匿名化した操作履歴、解析コードを管理する。',
    'data_management.metadata_plan': 'DataCite風メタデータと研究室内の命名規則を併用する。',
    'data_management.repository_plan': '機関リポジトリまたはGitHub Releasesにメタデータと公開可能なコードを登録する。',
    'governance.restriction_reason': '個人情報に該当する入力ログは匿名化し、集計値のみ公開する。',
    'governance.responsible_party': '佐藤 花子',
  };

  return { project, template, answers };
}
