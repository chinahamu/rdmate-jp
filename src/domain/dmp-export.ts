import { z } from 'zod';
import type { DmpAnswerMap, DmpAnswerValue } from './dmp-answer';
import { getFieldId, isAnswered } from './dmp-answer';
import type { DmpTemplate, DmpTemplateQuestion } from './dmp-template';
import type { Funding } from './funding';
import {
  createJapaneseDmpExportHeader,
  formatAffiliationHierarchy,
  getMemberAffiliationHierarchy,
  getMemberJapaneseName,
} from './japanese-institution';
import {
  getDataManager,
  getPrimaryInvestigator,
  shouldUseJapaneseDmpExport,
  type ResearchProject,
} from './research-project';
import { getResearchMemberDisplayName } from './research-member';

export type DmpExportContext = Readonly<{
  template: DmpTemplate;
  project: ResearchProject;
  answers: DmpAnswerMap;
  generatedAt: string;
}>;

export type DmpJsonExport = Readonly<{
  schemaVersion: '1.0.0';
  generatedAt: string;
  language: 'ja' | 'en';
  template: {
    id: string;
    version: string;
    name: string;
  };
  project: {
    id: string;
    title: string;
    summary: string;
    field: string;
    startDate: string;
    expectedEndDate: string;
    projectNumber?: string;
    institutionLocalProjectCode?: string;
    primaryInvestigator?: string;
    primaryInvestigatorNameJa?: string;
    primaryInvestigatorNameEn?: string;
    dataManager?: string;
    dataManagerNameJa?: string;
    dataManagerNameEn?: string;
    primaryAffiliationPath?: string;
    funding: Funding[];
  };
  answers: Array<{
    sectionId: string;
    sectionTitle: string;
    questionId: string;
    questionLabel: string;
    type: DmpTemplateQuestion['type'];
    required: boolean;
    answer: DmpAnswerValue;
    status: 'answered' | 'missing';
  }>;
}>;

export const dmpJsonExportSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  generatedAt: z.string().datetime(),
  language: z.enum(['ja', 'en']).default('ja'),
  template: z.object({
    id: z.string().min(1),
    version: z.string().min(1),
    name: z.string().min(1),
  }),
  project: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string(),
    field: z.string(),
    startDate: z.string(),
    expectedEndDate: z.string(),
    projectNumber: z.string().optional(),
    institutionLocalProjectCode: z.string().optional(),
    primaryInvestigator: z.string().optional(),
    primaryInvestigatorNameJa: z.string().optional(),
    primaryInvestigatorNameEn: z.string().optional(),
    dataManager: z.string().optional(),
    dataManagerNameJa: z.string().optional(),
    dataManagerNameEn: z.string().optional(),
    primaryAffiliationPath: z.string().optional(),
    funding: z.array(z.unknown()),
  }),
  answers: z.array(
    z.object({
      sectionId: z.string().min(1),
      sectionTitle: z.string().min(1),
      questionId: z.string().min(1),
      questionLabel: z.string().min(1),
      type: z.string().min(1),
      required: z.boolean(),
      answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()]),
      status: z.enum(['answered', 'missing']),
    }),
  ),
});

export function createDmpJsonExport(context: DmpExportContext): DmpJsonExport {
  const { template, project, answers, generatedAt } = context;
  const primaryInvestigator = getPrimaryInvestigator(project);
  const dataManager = getDataManager(project);
  const primaryName = primaryInvestigator ? getMemberJapaneseName(primaryInvestigator) : undefined;
  const dataManagerName = dataManager ? getMemberJapaneseName(dataManager) : undefined;
  const primaryAffiliation = primaryInvestigator ? getMemberAffiliationHierarchy(primaryInvestigator) : undefined;

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    language: project.preferredDmpLanguage ?? 'ja',
    template: {
      id: template.id,
      version: template.version,
      name: template.name,
    },
    project: {
      id: project.id,
      title: project.title,
      summary: project.summary,
      field: project.field,
      startDate: project.startDate,
      expectedEndDate: project.expectedEndDate,
      projectNumber: project.projectNumber,
      institutionLocalProjectCode: project.institutionLocalProjectCode,
      primaryInvestigator: primaryInvestigator ? getResearchMemberDisplayName(primaryInvestigator) : undefined,
      primaryInvestigatorNameJa: primaryName?.ja,
      primaryInvestigatorNameEn: primaryName?.en,
      dataManager: dataManager ? getResearchMemberDisplayName(dataManager) : undefined,
      dataManagerNameJa: dataManagerName?.ja,
      dataManagerNameEn: dataManagerName?.en,
      primaryAffiliationPath: primaryAffiliation ? formatAffiliationHierarchy(primaryAffiliation) : undefined,
      funding: project.funding,
    },
    answers: template.sections.flatMap((section) =>
      section.questions.map((question) => {
        const fieldId = getFieldId(section.id, question.id);
        const answer = answers[fieldId] ?? null;

        return {
          sectionId: section.id,
          sectionTitle: section.title,
          questionId: question.id,
          questionLabel: question.label,
          type: question.type,
          required: question.required,
          answer,
          status: isAnswered(answer) ? 'answered' : 'missing',
        };
      }),
    ),
  };
}

export function generateDmpJson(context: DmpExportContext): string {
  return JSON.stringify(createDmpJsonExport(context), null, 2);
}

export function generateDmpMarkdown(context: DmpExportContext): string {
  const jsonExport = createDmpJsonExport(context);
  const lines: string[] = shouldUseJapaneseDmpExport(context.project)
    ? createJapaneseDmpExportHeader(context.project)
    : [
        `# ${jsonExport.project.title}`,
        '',
        '| 項目 | 内容 |',
        '|---|---|',
        `| 研究分野 | ${escapeMarkdownTableCell(jsonExport.project.field)} |`,
        `| 研究期間 | ${escapeMarkdownTableCell(jsonExport.project.startDate)} - ${escapeMarkdownTableCell(jsonExport.project.expectedEndDate)} |`,
        `| 研究代表者 | ${escapeMarkdownTableCell(jsonExport.project.primaryInvestigator ?? '未設定')} |`,
        `| データ管理責任者 | ${escapeMarkdownTableCell(jsonExport.project.dataManager ?? '未設定')} |`,
        '',
      ];

  lines.splice(lines.length - 1, 0, `| テンプレート | ${escapeMarkdownTableCell(jsonExport.template.name)} v${escapeMarkdownTableCell(jsonExport.template.version)} |`);
  lines.splice(lines.length - 1, 0, `| 生成日時 | ${escapeMarkdownTableCell(jsonExport.generatedAt)} |`);

  for (const section of context.template.sections) {
    lines.push(`## ${section.title}`, '');
    if (section.description) {
      lines.push(section.description, '');
    }
    lines.push('| 設問 | 回答 | 必須 | 状態 |', '|---|---|---|---|');

    for (const question of section.questions) {
      const fieldId = getFieldId(section.id, question.id);
      const answer = context.answers[fieldId] ?? null;
      lines.push(
        `| ${escapeMarkdownTableCell(question.label)} | ${escapeMarkdownTableCell(formatAnswerValue(answer))} | ${question.required ? '必須' : '任意'} | ${isAnswered(answer) ? '入力済み' : '未入力'} |`,
      );
    }

    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

export function generateDmpCsv(context: DmpExportContext): string {
  const rows = createDmpJsonExport(context).answers.map((answer) => [
    answer.sectionId,
    answer.questionId,
    answer.questionLabel,
    formatAnswerValue(answer.answer),
    answer.required ? 'true' : 'false',
    answer.status,
  ]);

  return toCsv([
    ['section_id', 'question_id', 'question_label', 'answer', 'required', 'status'],
    ...rows,
  ]);
}

export function getDmpExportFileName(
  context: Pick<DmpExportContext, 'project' | 'template'>,
  extension: 'md' | 'json' | 'csv' | 'docx',
): string {
  const language = context.project.preferredDmpLanguage ?? 'ja';
  return `${slugify(context.project.title)}_${context.template.id}_${language}.${extension}`;
}

export function formatAnswerValue(value: DmpAnswerValue): string {
  if (value === null) return '';
  if (Array.isArray(value)) return value.join('; ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  return String(value);
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');

  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function escapeMarkdownTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9ー\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 80);
}
