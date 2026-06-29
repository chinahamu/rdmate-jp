import { z } from 'zod';
import type { DmpTemplate, DmpTemplateQuestion, DmpTemplateSection } from './dmp-template';
import type { ResearchProject } from './research-project';

export type DmpAnswerValue = string | string[] | number | boolean | null;

export type DmpAnswerMap = Record<string, DmpAnswerValue>;

export type DmpFormField = Readonly<{
  sectionId: string;
  questionId: string;
  fieldId: string;
  label: string;
  type: DmpTemplateQuestion['type'];
  required: boolean;
  helpText?: string;
  options?: string[];
  value: DmpAnswerValue;
}>;

export type DmpFormSection = Readonly<{
  id: string;
  title: string;
  description?: string;
  fields: DmpFormField[];
  completedRequiredCount: number;
  requiredCount: number;
}>;

export type DmpValidationIssueSeverity = 'error' | 'warning' | 'info';

export type DmpValidationIssue = Readonly<{
  fieldId: string;
  sectionId: string;
  questionId: string;
  severity: DmpValidationIssueSeverity;
  message: string;
}>;

export type DmpExamplePhrase = Readonly<{
  id: string;
  label: string;
  value: string;
  targetQuestionIds: string[];
}>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const emailSchema = z.string().email();
const urlSchema = z.string().url();

export const dmpLabelDefinitions = {
  ja: {
    saveSection: 'セクションを保存',
    unsavedChanges: '未保存の変更があります。',
    required: '必須',
    optional: '任意',
  },
  en: {
    saveSection: 'Save section',
    unsavedChanges: 'You have unsaved changes.',
    required: 'Required',
    optional: 'Optional',
  },
} as const;

export const dmpCandidateLists = {
  storageLocations: ['機関リポジトリ', '大学提供クラウド', '研究室サーバ', '外部データリポジトリ', '未定'],
  sharingPolicies: ['公開', '制限付き公開', '非公開'],
  licenses: ['CC BY 4.0', 'CC BY-NC 4.0', 'CC0', '独自条件', '未定'],
} as const;

export const dmpExamplePhrases: DmpExamplePhrase[] = [
  {
    id: 'storage-institutional-repository',
    label: '機関リポジトリ保存',
    value: '研究終了後、機関リポジトリにメタデータと公開可能なデータを登録します。',
    targetQuestionIds: ['storage_location', 'repository_plan', 'repository'],
  },
  {
    id: 'restricted-sharing',
    label: '制限付き公開',
    value: '個人情報・契約上の制約を確認したうえで、必要な範囲で制限付き公開とします。',
    targetQuestionIds: ['sharing_policy', 'access_limitations'],
  },
  {
    id: 'backup-policy',
    label: 'バックアップ方針',
    value: '研究期間中は大学提供クラウドと研究室管理ストレージに複製し、定期的にバックアップ状態を確認します。',
    targetQuestionIds: ['backup_policy'],
  },
];

export function getFieldId(sectionId: string, questionId: string): string {
  return `${sectionId}.${questionId}`;
}

export function generateDmpFormSections(
  template: DmpTemplate,
  answers: DmpAnswerMap = {},
): DmpFormSection[] {
  return template.sections.map((section) => {
    const fields = section.questions.map((question) => toFormField(section, question, answers));
    const requiredFields = fields.filter((field) => field.required);
    const completedRequiredCount = requiredFields.filter((field) => isAnswered(field.value)).length;

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      fields,
      requiredCount: requiredFields.length,
      completedRequiredCount,
    };
  });
}

export function toFormField(
  section: DmpTemplateSection,
  question: DmpTemplateQuestion,
  answers: DmpAnswerMap,
): DmpFormField {
  const fieldId = getFieldId(section.id, question.id);

  return {
    sectionId: section.id,
    questionId: question.id,
    fieldId,
    label: question.label,
    type: question.type,
    required: question.required,
    helpText: question.helpText,
    options: question.options,
    value: answers[fieldId] ?? null,
  };
}

export function isAnswered(value: DmpAnswerValue): boolean {
  if (value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;

  return true;
}

export function getSectionAnswers(section: DmpFormSection, answers: DmpAnswerMap): DmpAnswerMap {
  return Object.fromEntries(section.fields.map((field) => [field.fieldId, answers[field.fieldId] ?? null]));
}

export function applyProjectAutofill(template: DmpTemplate, project: ResearchProject): DmpAnswerMap {
  const answers: DmpAnswerMap = {};
  const dataManager = project.members.find((member) => member.id === project.dataManagerMemberId);
  const pi = project.members.find((member) => member.role === 'PI');
  const primaryFunding = project.funding[0];

  for (const section of template.sections) {
    for (const question of section.questions) {
      const fieldId = getFieldId(section.id, question.id);
      const id = question.id.toLowerCase();

      if (id.includes('research_field')) answers[fieldId] = project.field;
      if (id.includes('data_manager') || id.includes('data_owner') || id.includes('responsible_party')) {
        answers[fieldId] = dataManager?.name ?? pi?.name ?? '';
      }
      if (id.includes('repository') || id.includes('storage_location')) answers[fieldId] = '機関リポジトリ';
      if (id.includes('sharing_policy')) answers[fieldId] = '制限付き公開';
      if (id.includes('license')) answers[fieldId] = 'CC BY 4.0';
      if (id.includes('access_timeline')) answers[fieldId] = project.expectedEndDate;
      if (id.includes('data_types')) answers[fieldId] = `${project.title}で生成・収集する研究データ`;
      if (id.includes('funding') || id.includes('grant')) {
        answers[fieldId] = primaryFunding
          ? `${primaryFunding.agencyName} ${primaryFunding.programName}`
          : '';
      }
    }
  }

  return answers;
}

export function getExamplePhrasesForQuestion(questionId: string): DmpExamplePhrase[] {
  return dmpExamplePhrases.filter((phrase) => phrase.targetQuestionIds.includes(questionId));
}

export function validateDmpAnswers(
  template: DmpTemplate,
  answers: DmpAnswerMap,
  project?: Pick<ResearchProject, 'expectedEndDate'>,
): DmpValidationIssue[] {
  const issues: DmpValidationIssue[] = [];

  for (const section of template.sections) {
    for (const question of section.questions) {
      const fieldId = getFieldId(section.id, question.id);
      const value = answers[fieldId] ?? null;

      if (question.required && !isAnswered(value)) {
        issues.push({
          fieldId,
          sectionId: section.id,
          questionId: question.id,
          severity: 'error',
          message: `${question.label}は必須です。`,
        });
        continue;
      }

      if (!isAnswered(value)) continue;

      if (question.type === 'url' && typeof value === 'string' && !urlSchema.safeParse(value).success) {
        issues.push({ fieldId, sectionId: section.id, questionId: question.id, severity: 'error', message: 'URL形式が正しくありません。' });
      }

      if (question.type === 'date' && typeof value === 'string' && !dateStringSchema.safeParse(value).success) {
        issues.push({ fieldId, sectionId: section.id, questionId: question.id, severity: 'error', message: '日付はYYYY-MM-DD形式で入力してください。' });
      }

      if (question.id.toLowerCase().includes('email') && typeof value === 'string' && !emailSchema.safeParse(value).success) {
        issues.push({ fieldId, sectionId: section.id, questionId: question.id, severity: 'error', message: 'メールアドレス形式が正しくありません。' });
      }

      if (
        project &&
        question.id.toLowerCase().includes('publication_date') &&
        typeof value === 'string' &&
        dateStringSchema.safeParse(value).success &&
        new Date(value).getTime() < new Date(project.expectedEndDate).getTime()
      ) {
        issues.push({ fieldId, sectionId: section.id, questionId: question.id, severity: 'warning', message: '公開予定日が研究終了日より前です。公開時期を確認してください。' });
      }
    }
  }

  issues.push(...validateConditionalDmpRules(template, answers));

  return issues;
}

export function validateConditionalDmpRules(
  template: DmpTemplate,
  answers: DmpAnswerMap,
): DmpValidationIssue[] {
  const issues: DmpValidationIssue[] = [];
  const entries = Object.entries(answers);
  const privatePolicy = entries.find(([fieldId, value]) =>
    fieldId.toLowerCase().includes('sharing_policy') && value === '非公開',
  );
  const privateReason = entries.find(([fieldId]) => fieldId.toLowerCase().includes('private_reason'));

  if (privatePolicy && !isAnswered(privateReason?.[1] ?? null)) {
    const [fieldId] = privatePolicy;
    const [sectionId, questionId] = fieldId.split('.') as [string, string];
    issues.push({
      fieldId,
      sectionId,
      questionId,
      severity: 'error',
      message: '非公開を選択した場合は、非公開理由の入力が必要です。',
    });
  }

  const humanSubjectEntry = entries.find(([fieldId, value]) =>
    fieldId.toLowerCase().includes('human_subject') && (value === true || value === 'true' || value === '該当する'),
  );

  if (humanSubjectEntry) {
    const [fieldId] = humanSubjectEntry;
    const [sectionId, questionId] = fieldId.split('.') as [string, string];
    issues.push({
      fieldId,
      sectionId,
      questionId,
      severity: 'warning',
      message: '人を対象とする研究では、倫理審査、同意、匿名化、アクセス制御の記載を確認してください。',
    });
  }

  for (const section of template.sections) {
    for (const question of section.questions) {
      const fieldId = getFieldId(section.id, question.id);
      if (question.id.toLowerCase().includes('private_reason') && !isAnswered(answers[fieldId] ?? null)) {
        continue;
      }
    }
  }

  return issues;
}
