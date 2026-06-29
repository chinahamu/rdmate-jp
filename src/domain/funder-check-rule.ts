import { z } from 'zod';
import type { DmpAnswerMap, DmpAnswerValue, DmpValidationIssueSeverity } from './dmp-answer';
import { isAnswered } from './dmp-answer';
import type { DmpTemplate } from './dmp-template';
import { fundingAgencyTypeValues, type FundingAgencyType } from './funding';
import type { ResearchProject } from './research-project';

export const funderCheckRuleTypeValues = ['required', 'recommended', 'conditional', 'forbidden'] as const;
export type FunderCheckRuleType = (typeof funderCheckRuleTypeValues)[number];

export const funderCheckConditionOperatorValues = [
  'answered',
  'not_answered',
  'equals',
  'not_equals',
  'contains',
  'includes_any',
  'matches_any',
  'project_has_external_collaborator',
] as const;

export type FunderCheckConditionOperator = (typeof funderCheckConditionOperatorValues)[number];
export type FunderCheckLocale = 'ja' | 'en';
export type FunderCheckResultStatus = 'passed' | 'failed' | 'skipped';
export type FunderCheckReportStatus = 'compliant' | 'needs_review' | 'non_compliant';

const localizedTextSchema = z.object({
  ja: z.string().min(1),
  en: z.string().min(1),
});

const comparableValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);

export const funderCheckConditionSchema = z.object({
  fieldId: z.string().min(1).optional(),
  operator: z.enum(funderCheckConditionOperatorValues),
  value: comparableValueSchema.optional(),
  values: z.array(z.string().min(1)).optional(),
});

export const funderCheckRuleSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(funderCheckRuleTypeValues),
    targetTemplateIds: z.array(z.string().min(1)).default([]),
    targetFundingAgencyTypes: z.array(z.enum(fundingAgencyTypeValues)).default([]),
    severity: z.enum(['error', 'warning', 'info']).optional(),
    weight: z.number().int().min(0).max(100).default(10),
    conditionMode: z.enum(['all', 'any']).default('all'),
    conditions: z.array(funderCheckConditionSchema).default([]),
    fieldIds: z.array(z.string().min(1)).default([]),
    fieldGroups: z.array(z.array(z.string().min(1)).min(1)).default([]),
    forbiddenValues: z.array(comparableValueSchema).default([]),
    message: localizedTextSchema,
    remediation: localizedTextSchema,
    uraCommentPrompt: localizedTextSchema.optional(),
    libraryCommentPrompt: localizedTextSchema.optional(),
  })
  .superRefine((rule, context) => {
    if ((rule.type === 'required' || rule.type === 'recommended') && rule.fieldIds.length === 0 && rule.fieldGroups.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fieldIds'],
        message: 'required / recommended ルールには fieldIds または fieldGroups が必要です。',
      });
    }

    if (rule.type === 'conditional' && rule.conditions.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conditions'],
        message: 'conditional ルールには conditions が必要です。',
      });
    }

    if (rule.type === 'forbidden' && (rule.fieldIds.length === 0 || rule.forbiddenValues.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['forbiddenValues'],
        message: 'forbidden ルールには fieldIds と forbiddenValues が必要です。',
      });
    }
  });

export const funderCheckRuleSetSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  id: z.string().min(1),
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  targetFundingAgencyTypes: z.array(z.enum(fundingAgencyTypeValues)).min(1),
  sourceUrl: z.string().url().optional(),
  maintainer: z.string().min(1),
  lastReviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rules: z.array(funderCheckRuleSchema).min(1),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type FunderCheckCondition = z.infer<typeof funderCheckConditionSchema>;
export type FunderCheckRule = z.infer<typeof funderCheckRuleSchema>;
export type FunderCheckRuleSet = z.infer<typeof funderCheckRuleSetSchema>;

export type FunderCheckContext = Readonly<{
  template: DmpTemplate;
  answers: DmpAnswerMap;
  project?: ResearchProject;
}>;

export type FunderCheckViolation = Readonly<{
  fieldId?: string;
  fieldIds?: string[];
  value?: DmpAnswerValue;
  message: string;
}>;

export type FunderCheckRuleResult = Readonly<{
  ruleId: string;
  ruleType: FunderCheckRuleType;
  status: FunderCheckResultStatus;
  severity: DmpValidationIssueSeverity;
  weight: number;
  scoreContribution: number;
  message: string;
  remediation: string;
  violations: FunderCheckViolation[];
}>;

export type FunderCheckSummary = Readonly<{
  score: number;
  maxScore: number;
  passedScore: number;
  failedCount: number;
  skippedCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  status: FunderCheckReportStatus;
}>;

export type FunderCheckReviewCommentPrompt = Readonly<{
  role: 'ura' | 'library';
  label: string;
  prompt: string;
}>;

export type FunderCheckReport = Readonly<{
  ruleSetId: string;
  ruleSetName: string;
  templateId: string;
  templateName: string;
  targetFundingAgencyTypes: FundingAgencyType[];
  generatedAt: string;
  summary: FunderCheckSummary;
  results: FunderCheckRuleResult[];
  reviewCommentPrompts: FunderCheckReviewCommentPrompt[];
}>;

export function validateFunderCheckRuleSet(ruleSet: unknown): FunderCheckRuleSet {
  return funderCheckRuleSetSchema.parse(ruleSet);
}

export function evaluateFunderCheckRules(
  ruleSetInput: unknown,
  context: FunderCheckContext,
  locale: FunderCheckLocale = 'ja',
  generatedAt = new Date().toISOString(),
): FunderCheckReport {
  const ruleSet = validateFunderCheckRuleSet(ruleSetInput);
  const results = ruleSet.rules
    .filter((rule) => isRuleApplicable(rule, ruleSet, context))
    .map((rule) => evaluateRule(rule, context, locale));
  const summary = summarizeFunderCheckResults(results);

  return {
    ruleSetId: ruleSet.id,
    ruleSetName: localize(ruleSet.name, locale),
    templateId: context.template.id,
    templateName: context.template.name,
    targetFundingAgencyTypes: ruleSet.targetFundingAgencyTypes,
    generatedAt,
    summary,
    results,
    reviewCommentPrompts: collectReviewCommentPrompts(ruleSet.rules, locale),
  };
}

export function summarizeFunderCheckResults(results: FunderCheckRuleResult[]): FunderCheckSummary {
  const scoredResults = results.filter((result) => result.status !== 'skipped');
  const maxScore = scoredResults.reduce((total, result) => total + result.weight, 0);
  const passedScore = scoredResults.reduce((total, result) => total + result.scoreContribution, 0);
  const failedResults = results.filter((result) => result.status === 'failed');
  const score = maxScore === 0 ? 100 : Math.round((passedScore / maxScore) * 100);

  return {
    score,
    maxScore,
    passedScore,
    failedCount: failedResults.length,
    skippedCount: results.filter((result) => result.status === 'skipped').length,
    errorCount: failedResults.filter((result) => result.severity === 'error').length,
    warningCount: failedResults.filter((result) => result.severity === 'warning').length,
    infoCount: failedResults.filter((result) => result.severity === 'info').length,
    status: getReportStatus(score, failedResults),
  };
}

export function createFunderCheckMarkdownReport(
  report: FunderCheckReport,
  locale: FunderCheckLocale = 'ja',
): string {
  const lines = [
    `# ${locale === 'ja' ? '助成機関別DMPチェックレポート' : 'Funder-specific DMP Check Report'}`,
    '',
    `- ${locale === 'ja' ? 'ルールセット' : 'Rule set'}: ${report.ruleSetName}`,
    `- ${locale === 'ja' ? 'テンプレート' : 'Template'}: ${report.templateName} (${report.templateId})`,
    `- ${locale === 'ja' ? '生成日時' : 'Generated at'}: ${report.generatedAt}`,
    `- ${locale === 'ja' ? '適合スコア' : 'Compliance score'}: ${report.summary.score}/100`,
    `- ${locale === 'ja' ? 'ステータス' : 'Status'}: ${report.summary.status}`,
    '',
    `## ${locale === 'ja' ? 'チェック結果' : 'Results'}`,
    '',
    '| Rule | Type | Severity | Status | Message | Remediation |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.results.map((result) =>
      [
        result.ruleId,
        result.ruleType,
        result.severity,
        result.status,
        result.message,
        result.remediation,
      ]
        .map(escapeMarkdownTableCell)
        .join(' | '),
    ).map((line) => `| ${line} |`),
    '',
    `## ${locale === 'ja' ? 'URA・図書館担当者向けコメント欄' : 'Reviewer comment prompts'}`,
    '',
    ...report.reviewCommentPrompts.map((prompt) => `- **${prompt.label}**: ${prompt.prompt}`),
    '',
  ];

  return lines.join('\n');
}

export function createFunderCheckPdfReport(report: FunderCheckReport, locale: FunderCheckLocale = 'ja'): string {
  const title = locale === 'ja' ? 'Funder-specific DMP Check Report' : 'Funder-specific DMP Check Report';
  const lines = [
    title,
    `Rule set: ${report.ruleSetName}`,
    `Template: ${report.templateName} (${report.templateId})`,
    `Generated: ${report.generatedAt}`,
    `Score: ${report.summary.score}/100`,
    `Status: ${report.summary.status}`,
    `Errors: ${report.summary.errorCount}  Warnings: ${report.summary.warningCount}  Info: ${report.summary.infoCount}`,
    '',
    ...report.results.slice(0, 24).map((result) => `${result.status.toUpperCase()} ${result.ruleId}: ${result.message}`),
  ];

  return buildSimplePdf(lines);
}

function evaluateRule(
  rule: FunderCheckRule,
  context: FunderCheckContext,
  locale: FunderCheckLocale,
): FunderCheckRuleResult {
  const severity = rule.severity ?? getDefaultSeverity(rule.type);
  const conditionsMet = areConditionsMet(rule, context);

  if (!conditionsMet) {
    return {
      ruleId: rule.id,
      ruleType: rule.type,
      status: 'skipped',
      severity,
      weight: rule.weight,
      scoreContribution: 0,
      message: localize(rule.message, locale),
      remediation: localize(rule.remediation, locale),
      violations: [],
    };
  }

  const violations = collectRuleViolations(rule, context, locale);
  const passed = violations.length === 0;

  return {
    ruleId: rule.id,
    ruleType: rule.type,
    status: passed ? 'passed' : 'failed',
    severity,
    weight: rule.weight,
    scoreContribution: passed ? rule.weight : 0,
    message: localize(rule.message, locale),
    remediation: localize(rule.remediation, locale),
    violations,
  };
}

function isRuleApplicable(rule: FunderCheckRule, ruleSet: FunderCheckRuleSet, context: FunderCheckContext): boolean {
  const templateMatched = rule.targetTemplateIds.length === 0 || rule.targetTemplateIds.includes(context.template.id);
  const targetAgencyTypes = rule.targetFundingAgencyTypes.length > 0 ? rule.targetFundingAgencyTypes : ruleSet.targetFundingAgencyTypes;
  const projectAgencyTypes = context.project?.funding.map((funding) => funding.agencyType) ?? [];
  const templateAgencyTypes = context.template.targetFundingAgencyTypes;
  const agencyMatched = targetAgencyTypes.some(
    (agencyType) => projectAgencyTypes.includes(agencyType) || templateAgencyTypes.includes(agencyType),
  );

  return templateMatched && agencyMatched;
}

function areConditionsMet(rule: FunderCheckRule, context: FunderCheckContext): boolean {
  if (rule.conditions.length === 0) return true;

  const checks = rule.conditions.map((condition) => evaluateCondition(condition, context));
  return rule.conditionMode === 'any' ? checks.some(Boolean) : checks.every(Boolean);
}

function evaluateCondition(condition: FunderCheckCondition, context: FunderCheckContext): boolean {
  if (condition.operator === 'project_has_external_collaborator') {
    return context.project?.members.some((member) => member.role === 'EXTERNAL_COLLABORATOR') ?? false;
  }

  const value = condition.fieldId ? context.answers[condition.fieldId] ?? null : getCombinedSearchText(context);

  if (condition.operator === 'answered') return isAnswered(value as DmpAnswerValue);
  if (condition.operator === 'not_answered') return !isAnswered(value as DmpAnswerValue);
  if (condition.operator === 'equals') return compareAnswerValue(value, condition.value);
  if (condition.operator === 'not_equals') return !compareAnswerValue(value, condition.value);
  if (condition.operator === 'contains') return formatValueForSearch(value).includes(String(condition.value ?? ''));
  if (condition.operator === 'includes_any' || condition.operator === 'matches_any') {
    return (condition.values ?? []).some((candidate) => formatValueForSearch(value).includes(candidate));
  }

  return false;
}

function collectRuleViolations(
  rule: FunderCheckRule,
  context: FunderCheckContext,
  locale: FunderCheckLocale,
): FunderCheckViolation[] {
  if (rule.type === 'forbidden') {
    return rule.fieldIds.flatMap((fieldId) => {
      const value = context.answers[fieldId] ?? null;
      const forbidden = rule.forbiddenValues.some((candidate) => compareAnswerValue(value, candidate));
      return forbidden
        ? [
            {
              fieldId,
              value: value as DmpAnswerValue,
              message: `${getFieldLabel(context.template, fieldId)} ${locale === 'ja' ? 'に禁止値が含まれています。' : 'contains a forbidden value.'}`,
            },
          ]
        : [];
    });
  }

  const missingFields = rule.fieldIds.filter((fieldId) => !isAnswered((context.answers[fieldId] ?? null) as DmpAnswerValue));
  const missingGroups = rule.fieldGroups.filter(
    (group) => !group.some((fieldId) => isAnswered((context.answers[fieldId] ?? null) as DmpAnswerValue)),
  );

  return [
    ...missingFields.map((fieldId) => ({
      fieldId,
      value: context.answers[fieldId] as DmpAnswerValue,
      message: `${getFieldLabel(context.template, fieldId)} ${locale === 'ja' ? 'が未入力です。' : 'is missing.'}`,
    })),
    ...missingGroups.map((fieldIds) => ({
      fieldIds,
      message: `${fieldIds.map((fieldId) => getFieldLabel(context.template, fieldId)).join(' / ')} ${locale === 'ja' ? 'のいずれかを入力してください。' : 'requires at least one answer.'}`,
    })),
  ];
}

function collectReviewCommentPrompts(
  rules: FunderCheckRule[],
  locale: FunderCheckLocale,
): FunderCheckReviewCommentPrompt[] {
  const prompts: FunderCheckReviewCommentPrompt[] = [];

  for (const rule of rules) {
    if (rule.uraCommentPrompt) {
      prompts.push({ role: 'ura', label: `URA: ${rule.id}`, prompt: localize(rule.uraCommentPrompt, locale) });
    }
    if (rule.libraryCommentPrompt) {
      prompts.push({ role: 'library', label: `Library: ${rule.id}`, prompt: localize(rule.libraryCommentPrompt, locale) });
    }
  }

  const unique = new Map<string, FunderCheckReviewCommentPrompt>();
  for (const prompt of prompts) unique.set(`${prompt.role}:${prompt.prompt}`, prompt);

  return [...unique.values()];
}

function getDefaultSeverity(ruleType: FunderCheckRuleType): DmpValidationIssueSeverity {
  if (ruleType === 'recommended') return 'warning';
  return 'error';
}

function getReportStatus(score: number, failedResults: FunderCheckRuleResult[]): FunderCheckReportStatus {
  if (failedResults.some((result) => result.severity === 'error')) return 'non_compliant';
  if (score >= 90) return 'compliant';
  return 'needs_review';
}

function localize(text: LocalizedText, locale: FunderCheckLocale): string {
  return text[locale] ?? text.ja;
}

function getFieldLabel(template: DmpTemplate, fieldId: string): string {
  const [sectionId, questionId] = fieldId.split('.') as [string, string];
  const section = template.sections.find((candidate) => candidate.id === sectionId);
  const question = section?.questions.find((candidate) => candidate.id === questionId);

  return question ? `${section?.title ?? sectionId} / ${question.label}` : fieldId;
}

function getCombinedSearchText(context: FunderCheckContext): string {
  const answerText = Object.values(context.answers).map(formatValueForSearch).join('\n');
  const projectText = context.project
    ? [
        context.project.title,
        context.project.summary,
        context.project.field,
        ...context.project.members.map((member) => `${member.name} ${member.affiliation} ${member.role}`),
      ].join('\n')
    : '';

  return `${answerText}\n${projectText}`;
}

function compareAnswerValue(value: unknown, expected: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => compareAnswerValue(item, expected));
  }
  if (Array.isArray(expected)) {
    return expected.some((item) => compareAnswerValue(value, item));
  }

  return String(value ?? '') === String(expected ?? '');
}

function formatValueForSearch(value: unknown): string {
  if (value === null || typeof value === 'undefined') return '';
  if (Array.isArray(value)) return value.map(formatValueForSearch).join('\n');

  return String(value);
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function buildSimplePdf(lines: string[]): string {
  const pageLines = lines.slice(0, 32);
  const textCommands = pageLines
    .map((line, index) => `BT /F1 10 Tf 50 ${780 - index * 22} Td ${toPdfHexString(line)} Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${textCommands.length} >>\nstream\n${textCommands}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return pdf;
}

function toPdfHexString(value: string): string {
  const bytes = ['FE', 'FF'];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes.push(code.toString(16).padStart(4, '0').toUpperCase());
  }

  return `<${bytes.join('')}>`;
}
