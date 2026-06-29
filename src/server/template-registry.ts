import genericTemplateV1 from '../../templates/dmp/generic-jp-v1.json';
import genericTemplateV2 from '../../templates/dmp/generic-jp-v2.json';
import computationalAiTemplate from '../../templates/dmp/computational-ai-jp-v1.json';
import humanitiesSocialScienceTemplate from '../../templates/dmp/humanities-social-science-jp-v1.json';
import humanSubjectsTemplate from '../../templates/dmp/human-subjects-jp-v1.json';
import japaneseFunderTemplate from '../../templates/dmp/japanese-funder-jp-v1.json';
import lifeScienceMedicalTemplate from '../../templates/dmp/life-science-medical-jp-v1.json';
import nihStyleTemplate from '../../templates/dmp/nih-style-v1.json';
import universityBasicTemplate from '../../templates/dmp/university-basic-v1.json';
import {
  isDmpTemplateActive,
  migrateTemplateAnswers,
  summarizeDmpTemplate,
  validateDmpTemplate,
  validateDmpTemplateMigrationPlan,
  type DmpTemplate,
  type DmpTemplateAnswerMap,
  type DmpTemplateMigrationPlan,
  type DmpTemplateMigrationReport,
  type DmpTemplateSummary,
  type DmpTemplateType,
} from '../domain/dmp-template';
import type { FundingAgencyType } from '../domain/funding';

export const templateIds = [
  'generic-jp-v1',
  'generic-jp-v2',
  'university-basic-v1',
  'japanese-funder-jp-v1',
  'nih-style-v1',
  'human-subjects-jp-v1',
  'life-science-medical-jp-v1',
  'humanities-social-science-jp-v1',
  'computational-ai-jp-v1',
] as const;

export type TemplateRegistryId = (typeof templateIds)[number];

export type ListDmpTemplatesOptions = Readonly<{
  includeDeprecated?: boolean;
}>;

const templates = [
  genericTemplateV1,
  genericTemplateV2,
  universityBasicTemplate,
  japaneseFunderTemplate,
  nihStyleTemplate,
  humanSubjectsTemplate,
  lifeScienceMedicalTemplate,
  humanitiesSocialScienceTemplate,
  computationalAiTemplate,
].map((template) => validateDmpTemplate(template));

const migrationPlans = [
  validateDmpTemplateMigrationPlan({
    fromTemplateId: 'generic-jp-v1',
    toTemplateId: 'generic-jp-v2',
    preserveUnmappedAnswers: true,
    mappings: [
      {
        fromFieldId: 'data_description.data_types',
        toFieldId: 'data_description.data_types',
        note: 'データ種別の回答はそのまま移行します。',
      },
      {
        fromFieldId: 'data_description.data_formats',
        toFieldId: 'data_description.data_formats',
      },
      {
        fromFieldId: 'storage_and_sharing.storage_location',
        toFieldId: 'storage_and_sharing.storage_locations',
        transform: 'string_to_array',
        note: '単一の保存場所を複数選択項目へ変換します。',
      },
      {
        fromFieldId: 'storage_and_sharing.sharing_policy',
        toFieldId: 'storage_and_sharing.sharing_policy',
      },
      {
        fromFieldId: 'storage_and_sharing.retention_period',
        toFieldId: 'storage_and_sharing.retention_period',
      },
      {
        fromFieldId: 'responsibility.data_manager',
        toFieldId: 'responsibility.data_manager',
      },
    ],
  }),
] as const;

export function listDmpTemplates(options: ListDmpTemplatesOptions = {}): DmpTemplateSummary[] {
  return selectTemplates(options).map((template) => summarizeDmpTemplate(template));
}

export function listAllDmpTemplates(): DmpTemplateSummary[] {
  return listDmpTemplates({ includeDeprecated: true });
}

export function listDeprecatedDmpTemplates(): DmpTemplateSummary[] {
  return templates.filter((template) => !isDmpTemplateActive(template)).map((template) => summarizeDmpTemplate(template));
}

export function getDmpTemplateById(templateId: string): DmpTemplate | undefined {
  return templates.find((template) => template.id === templateId);
}

export function listDmpTemplatesByFundingAgencyType(
  agencyType: FundingAgencyType,
  options: ListDmpTemplatesOptions = {},
): DmpTemplateSummary[] {
  return listDmpTemplates(options).filter((template) =>
    template.targetFundingAgencyTypes.includes(agencyType),
  );
}

export function listDmpTemplatesByType(
  templateType: DmpTemplateType,
  options: ListDmpTemplatesOptions = {},
): DmpTemplateSummary[] {
  return listDmpTemplates(options).filter((template) => template.templateType === templateType);
}

export function listDmpTemplatesByDiscipline(
  targetDiscipline: string,
  options: ListDmpTemplatesOptions = {},
): DmpTemplateSummary[] {
  return listDmpTemplates(options).filter((template) => template.targetDiscipline === targetDiscipline);
}

export function getDmpTemplateMigrationPlan(
  fromTemplateId: string,
  toTemplateId: string,
): DmpTemplateMigrationPlan | undefined {
  return migrationPlans.find(
    (plan) => plan.fromTemplateId === fromTemplateId && plan.toTemplateId === toTemplateId,
  );
}

export function migrateDmpTemplateAnswers(
  fromTemplateId: string,
  toTemplateId: string,
  answers: DmpTemplateAnswerMap,
): DmpTemplateMigrationReport {
  const migrationPlan = getDmpTemplateMigrationPlan(fromTemplateId, toTemplateId);
  const targetTemplate = getDmpTemplateById(toTemplateId);

  if (!migrationPlan) {
    throw new Error(`テンプレート移行定義が見つかりません: ${fromTemplateId} -> ${toTemplateId}`);
  }

  if (!targetTemplate) {
    throw new Error(`移行先テンプレートが見つかりません: ${toTemplateId}`);
  }

  return migrateTemplateAnswers(answers, migrationPlan, targetTemplate);
}

export function getDefaultDmpTemplateId(): string {
  return 'generic-jp-v2';
}

function selectTemplates(options: ListDmpTemplatesOptions): DmpTemplate[] {
  return options.includeDeprecated ? templates : templates.filter(isDmpTemplateActive);
}
