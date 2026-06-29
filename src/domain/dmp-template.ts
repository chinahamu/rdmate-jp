import { z } from 'zod';
import { fundingAgencyTypeValues, type FundingAgencyType } from './funding';

export const dmpQuestionTypeValues = [
  'text',
  'textarea',
  'select',
  'multi_select',
  'date',
  'url',
  'number',
  'boolean',
] as const;

export type DmpQuestionType = (typeof dmpQuestionTypeValues)[number];

export const dmpTemplateLocaleValues = ['ja', 'en', 'ja-en'] as const;
export type DmpTemplateLocale = (typeof dmpTemplateLocaleValues)[number];

export const dmpTemplateTypeValues = [
  'generic',
  'university_lab',
  'japanese_funder',
  'nih_dms',
  'human_subjects',
  'life_science_medical',
  'humanities_social_science',
  'computational_ai',
] as const;

export type DmpTemplateType = (typeof dmpTemplateTypeValues)[number];

export const dmpTemplateTypeLabels: Record<DmpTemplateType, string> = {
  generic: '汎用DMP',
  university_lab: '大学研究室向け',
  japanese_funder: '日本の助成機関向け',
  nih_dms: 'NIH DMS Plan風',
  human_subjects: '人を対象とする研究向け',
  life_science_medical: '生命科学・医学系向け',
  humanities_social_science: '人文社会科学向け',
  computational_ai: '計算科学・AI研究向け',
};

const optionRequiredQuestionTypes = new Set<DmpQuestionType>(['select', 'multi_select']);
const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'version は semver 形式で指定してください。');
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で指定してください。');
const fieldIdSchema = z.string().regex(/^[^.]+\.[^.]+$/, '質問IDは section.question 形式で指定してください。');

export const dmpTemplateQuestionSchema = z
  .object({
    id: z.string().min(1, '質問IDは必須です。'),
    label: z.string().min(1, '質問ラベルは必須です。'),
    type: z.enum(dmpQuestionTypeValues),
    required: z.boolean().default(false),
    helpText: z.string().min(1).optional(),
    options: z.array(z.string().min(1)).optional(),
    order: z.number().int().positive(),
  })
  .superRefine((question, context) => {
    if (optionRequiredQuestionTypes.has(question.type) && (!question.options || question.options.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'select / multi_select 型の質問には options が必要です。',
      });
    }

    if (!optionRequiredQuestionTypes.has(question.type) && question.options && question.options.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'options は select / multi_select 型の質問にのみ指定できます。',
      });
    }
  });

export const dmpTemplateSectionSchema = z.object({
  id: z.string().min(1, 'セクションIDは必須です。'),
  title: z.string().min(1, 'セクションタイトルは必須です。'),
  description: z.string().min(1).optional(),
  order: z.number().int().positive(),
  questions: z.array(dmpTemplateQuestionSchema).min(1, 'セクションには1件以上の質問が必要です。'),
});

export const dmpTemplateDeprecationSchema = z.object({
  deprecatedAt: dateStringSchema,
  replacedBy: z.string().min(1).optional(),
  reason: z.string().min(1),
});

export const dmpTemplateSchema = z
  .object({
    id: z.string().min(1, 'テンプレートIDは必須です。'),
    name: z.string().min(1, 'テンプレート名は必須です。'),
    version: semverSchema,
    locale: z.enum(dmpTemplateLocaleValues).optional(),
    language: z.enum(dmpTemplateLocaleValues).optional(),
    templateType: z.enum(dmpTemplateTypeValues).default('generic'),
    description: z.string().min(1).optional(),
    targetFunder: z.string().min(1).default('general'),
    targetDiscipline: z.string().min(1).default('general'),
    targetFundingAgencyTypes: z.array(z.enum(fundingAgencyTypeValues)).default(['other']),
    sourceUrl: z.string().url('sourceUrl はURL形式で指定してください。').optional(),
    maintainer: z.string().min(1).default('RDMate JP project'),
    lastReviewedAt: dateStringSchema.optional(),
    lastUpdated: dateStringSchema,
    compatibleTemplateVersions: z.array(z.string().min(1)).default([]),
    deprecated: dmpTemplateDeprecationSchema.optional(),
    sections: z.array(dmpTemplateSectionSchema).min(1, 'テンプレートには1件以上のセクションが必要です。'),
  })
  .superRefine((template, context) => {
    const sectionIds = new Set<string>();
    const questionIds = new Set<string>();

    for (const section of template.sections) {
      if (sectionIds.has(section.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections'],
          message: `セクションIDが重複しています: ${section.id}`,
        });
      }
      sectionIds.add(section.id);

      for (const question of section.questions) {
        const scopedQuestionId = `${section.id}.${question.id}`;
        if (questionIds.has(scopedQuestionId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections'],
            message: `質問IDが重複しています: ${scopedQuestionId}`,
          });
        }
        questionIds.add(scopedQuestionId);
      }
    }
  });

export const dmpTemplateMigrationValueTransformValues = ['copy', 'string_to_array', 'array_to_string'] as const;
export type DmpTemplateMigrationValueTransform = (typeof dmpTemplateMigrationValueTransformValues)[number];

export const dmpTemplateQuestionMigrationSchema = z.object({
  fromFieldId: fieldIdSchema,
  toFieldId: fieldIdSchema,
  transform: z.enum(dmpTemplateMigrationValueTransformValues).default('copy'),
  note: z.string().min(1).optional(),
});

export const dmpTemplateMigrationPlanSchema = z.object({
  fromTemplateId: z.string().min(1),
  toTemplateId: z.string().min(1),
  mappings: z.array(dmpTemplateQuestionMigrationSchema).min(1),
  preserveUnmappedAnswers: z.boolean().default(true),
});

export type DmpTemplateQuestion = z.infer<typeof dmpTemplateQuestionSchema>;
export type DmpTemplateSection = z.infer<typeof dmpTemplateSectionSchema>;
export type DmpTemplateDeprecation = z.infer<typeof dmpTemplateDeprecationSchema>;
export type DmpTemplateInput = z.input<typeof dmpTemplateSchema>;
export type DmpTemplateParsed = z.infer<typeof dmpTemplateSchema>;
export type DmpTemplateMigrationPlan = z.infer<typeof dmpTemplateMigrationPlanSchema>;
export type DmpTemplateQuestionMigration = z.infer<typeof dmpTemplateQuestionMigrationSchema>;
export type DmpTemplateAnswerMap = Record<string, unknown>;

export type DmpTemplate = Omit<DmpTemplateParsed, 'language' | 'locale' | 'sections'> &
  Readonly<{
    locale: DmpTemplateLocale;
    language: DmpTemplateLocale;
    sections: DmpTemplateSection[];
  }>;

export type DmpTemplateSummary = Readonly<{
  id: string;
  name: string;
  version: string;
  locale: DmpTemplateLocale;
  templateType: DmpTemplateType;
  templateTypeLabel: string;
  description?: string;
  targetFunder: string;
  targetDiscipline: string;
  targetFundingAgencyTypes: FundingAgencyType[];
  sourceUrl?: string;
  maintainer: string;
  lastReviewedAt?: string;
  lastUpdated: string;
  compatibleTemplateVersions: string[];
  deprecated?: DmpTemplateDeprecation;
  sectionCount: number;
  questionCount: number;
}>;

export type DmpTemplateMigrationHistoryEntry = Readonly<{
  fromFieldId: string;
  toFieldId?: string;
  value: unknown;
  status: 'migrated' | 'unmapped';
  note?: string;
}>;

export type DmpTemplateMigrationReport = Readonly<{
  fromTemplateId: string;
  toTemplateId: string;
  migratedAnswers: DmpTemplateAnswerMap;
  history: DmpTemplateMigrationHistoryEntry[];
  migratedFieldIds: string[];
  unmappedSourceFieldIds: string[];
  missingTargetFieldIds: string[];
}>;

export function validateDmpTemplate(template: unknown): DmpTemplate {
  const parsed = dmpTemplateSchema.parse(template);
  const locale = parsed.locale ?? parsed.language ?? 'ja';

  return {
    ...parsed,
    locale,
    language: parsed.language ?? locale,
    sections: sortTemplateSections(parsed.sections),
  };
}

export function validateDmpTemplateMigrationPlan(plan: unknown): DmpTemplateMigrationPlan {
  return dmpTemplateMigrationPlanSchema.parse(plan);
}

export function sortTemplateSections(sections: DmpTemplateSection[]): DmpTemplateSection[] {
  return [...sections]
    .sort((left, right) => left.order - right.order)
    .map((section) => ({
      ...section,
      questions: [...section.questions].sort((left, right) => left.order - right.order),
    }));
}

export function countTemplateQuestions(template: Pick<DmpTemplate, 'sections'>): number {
  return template.sections.reduce((total, section) => total + section.questions.length, 0);
}

export function summarizeDmpTemplate(template: DmpTemplate): DmpTemplateSummary {
  return {
    id: template.id,
    name: template.name,
    version: template.version,
    locale: template.locale,
    templateType: template.templateType,
    templateTypeLabel: getDmpTemplateTypeLabel(template.templateType),
    description: template.description,
    targetFunder: template.targetFunder,
    targetDiscipline: template.targetDiscipline,
    targetFundingAgencyTypes: template.targetFundingAgencyTypes,
    sourceUrl: template.sourceUrl,
    maintainer: template.maintainer,
    lastReviewedAt: template.lastReviewedAt,
    lastUpdated: template.lastUpdated,
    compatibleTemplateVersions: template.compatibleTemplateVersions,
    deprecated: template.deprecated,
    sectionCount: template.sections.length,
    questionCount: countTemplateQuestions(template),
  };
}

export function getDmpTemplateTypeLabel(templateType: DmpTemplateType): string {
  return dmpTemplateTypeLabels[templateType];
}

export function isDmpTemplateDeprecated(template: Pick<DmpTemplate, 'deprecated'>): boolean {
  return Boolean(template.deprecated);
}

export function isDmpTemplateActive(template: Pick<DmpTemplate, 'deprecated'>): boolean {
  return !isDmpTemplateDeprecated(template);
}

export function findRequiredTemplateQuestions(template: DmpTemplate): DmpTemplateQuestion[] {
  return template.sections.flatMap((section) => section.questions.filter((question) => question.required));
}

export function listTemplateFieldIds(template: Pick<DmpTemplate, 'sections'>): string[] {
  return template.sections.flatMap((section) =>
    section.questions.map((question) => `${section.id}.${question.id}`),
  );
}

export function migrateTemplateAnswers(
  answers: DmpTemplateAnswerMap,
  migrationPlan: DmpTemplateMigrationPlan,
  targetTemplate?: Pick<DmpTemplate, 'sections'>,
): DmpTemplateMigrationReport {
  const plan = validateDmpTemplateMigrationPlan(migrationPlan);
  const targetFieldIds = targetTemplate ? new Set(listTemplateFieldIds(targetTemplate)) : undefined;
  const migratedAnswers: DmpTemplateAnswerMap = {};
  const history: DmpTemplateMigrationHistoryEntry[] = [];
  const migratedFieldIds: string[] = [];
  const mappedSourceFieldIds = new Set<string>();
  const missingTargetFieldIds = new Set<string>();

  for (const mapping of plan.mappings) {
    mappedSourceFieldIds.add(mapping.fromFieldId);

    if (!(mapping.fromFieldId in answers)) continue;

    if (targetFieldIds && !targetFieldIds.has(mapping.toFieldId)) {
      missingTargetFieldIds.add(mapping.toFieldId);
      history.push({
        fromFieldId: mapping.fromFieldId,
        toFieldId: mapping.toFieldId,
        value: answers[mapping.fromFieldId],
        status: 'unmapped',
        note: `移行先テンプレートに ${mapping.toFieldId} が存在しません。`,
      });
      continue;
    }

    migratedAnswers[mapping.toFieldId] = applyMigrationValueTransform(
      answers[mapping.fromFieldId],
      mapping.transform,
    );
    migratedFieldIds.push(mapping.toFieldId);
    history.push({
      fromFieldId: mapping.fromFieldId,
      toFieldId: mapping.toFieldId,
      value: answers[mapping.fromFieldId],
      status: 'migrated',
      note: mapping.note,
    });
  }

  const unmappedSourceFieldIds: string[] = [];

  if (plan.preserveUnmappedAnswers) {
    for (const [fieldId, value] of Object.entries(answers)) {
      if (mappedSourceFieldIds.has(fieldId)) continue;
      unmappedSourceFieldIds.push(fieldId);
      history.push({ fromFieldId: fieldId, value, status: 'unmapped', note: '移行対応表にない旧回答です。' });
    }
  }

  return {
    fromTemplateId: plan.fromTemplateId,
    toTemplateId: plan.toTemplateId,
    migratedAnswers,
    history,
    migratedFieldIds,
    unmappedSourceFieldIds,
    missingTargetFieldIds: [...missingTargetFieldIds],
  };
}

function applyMigrationValueTransform(
  value: unknown,
  transform: DmpTemplateMigrationValueTransform,
): unknown {
  if (transform === 'string_to_array') {
    if (value === null || typeof value === 'undefined') return [];
    return Array.isArray(value) ? value : [String(value)];
  }

  if (transform === 'array_to_string') {
    return Array.isArray(value) ? value.join(', ') : value;
  }

  return value;
}
