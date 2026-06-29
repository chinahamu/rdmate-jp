import { z } from 'zod';
import { codeRepositorySchema, type CodeRepository } from './code-repository';
import { fundingSchema, type Funding } from './funding';
import {
  getDmpResponsibleCandidates,
  researchMemberSchema,
  type ResearchMember,
} from './research-member';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日付はYYYY-MM-DD形式で入力してください。',
});

export const researchProjectStatusValues = ['draft', 'active', 'completed', 'archived'] as const;

export type ResearchProjectStatus = (typeof researchProjectStatusValues)[number];

export const dmpLanguageValues = ['ja', 'en'] as const;
export type DmpLanguage = (typeof dmpLanguageValues)[number];

export const researchProjectSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1, '研究課題名は必須です。'),
    summary: z.string().min(1, '概要は必須です。'),
    field: z.string().min(1, '研究分野は必須です。'),
    startDate: dateStringSchema,
    expectedEndDate: dateStringSchema,
    status: z.enum(researchProjectStatusValues).default('draft'),
    projectNumber: z.string().min(1).optional(),
    preferredDmpLanguage: z.enum(dmpLanguageValues).default('ja'),
    institutionLocalProjectCode: z.string().min(1).optional(),
    members: z.array(researchMemberSchema).min(1, '研究メンバーを1名以上登録してください。'),
    funding: z.array(fundingSchema).default([]),
    codeRepositories: z.array(codeRepositorySchema).default([]),
    dataManagerMemberId: z.string().min(1, '研究データ管理責任者を指定してください。'),
  })
  .superRefine((project, context) => {
    if (!isProjectPeriodValid(project)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expectedEndDate'],
        message: '終了予定日は開始日以降にしてください。',
      });
    }

    if (!project.members.some((member) => member.role === 'PI')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['members'],
        message: '研究代表者（PI）を1名以上登録してください。',
      });
    }

    if (!project.members.some((member) => member.id === project.dataManagerMemberId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataManagerMemberId'],
        message: '研究データ管理責任者は登録済みメンバーから選択してください。',
      });
    }
  });

export type ResearchProjectInput = z.input<typeof researchProjectSchema>;
export type ResearchProject = z.infer<typeof researchProjectSchema>;

export function createResearchProject(input: ResearchProjectInput): ResearchProject {
  return researchProjectSchema.parse(input);
}

export function isProjectPeriodValid(project: Pick<ResearchProject, 'startDate' | 'expectedEndDate'>) {
  if (!project.startDate || !project.expectedEndDate) {
    return true;
  }

  return new Date(project.startDate).getTime() <= new Date(project.expectedEndDate).getTime();
}

export function getPrimaryInvestigator(project: Pick<ResearchProject, 'members'>): ResearchMember | undefined {
  return project.members.find((member) => member.role === 'PI');
}

export function getCoResearchers(project: Pick<ResearchProject, 'members'>): ResearchMember[] {
  return project.members.filter((member) => member.role !== 'PI');
}

export function getProjectAffiliations(project: Pick<ResearchProject, 'members'>): string[] {
  return Array.from(new Set(project.members.map((member) => member.affiliation))).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );
}

export function getDataManager(project: Pick<ResearchProject, 'members' | 'dataManagerMemberId'>) {
  return project.members.find((member) => member.id === project.dataManagerMemberId);
}

export function getDmpResponsibleMemberCandidates(
  project: Pick<ResearchProject, 'members'>,
): ResearchMember[] {
  return getDmpResponsibleCandidates(project.members);
}

export function getProjectFundingSummary(project: Pick<ResearchProject, 'funding'>): Funding[] {
  return project.funding;
}

export function getProjectCodeRepositories(project: Pick<ResearchProject, 'codeRepositories'>): CodeRepository[] {
  return project.codeRepositories;
}

export function shouldUseJapaneseDmpExport(project: Pick<ResearchProject, 'preferredDmpLanguage'>): boolean {
  return project.preferredDmpLanguage === 'ja';
}
