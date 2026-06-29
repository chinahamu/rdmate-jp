import { z } from 'zod';
import {
  createInstitutionRorIdentifier,
  createResearcherOrcidIdentifier,
  orcidIdentifierSchema,
  rorIdentifierSchema,
  type ExternalIdentifier,
} from './external-identifier';

export const researchMemberRoleValues = [
  'PI',
  'CO_I',
  'DATA_STEWARD',
  'STUDENT',
  'EXTERNAL_COLLABORATOR',
] as const;

export type ResearchMemberRole = (typeof researchMemberRoleValues)[number];

export const researchMemberRoleLabels: Record<ResearchMemberRole, string> = {
  PI: '研究代表者',
  CO_I: '共同研究者',
  DATA_STEWARD: '研究データ管理担当者',
  STUDENT: '学生',
  EXTERNAL_COLLABORATOR: '外部共同研究者',
};

export const affiliationHierarchySchema = z.object({
  institution: z.string().min(1, '研究機関名は必須です。'),
  graduateSchool: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  major: z.string().optional(),
  laboratory: z.string().optional(),
});

export type ResearchMemberAffiliationHierarchy = z.infer<typeof affiliationHierarchySchema>;

export const researchMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '氏名は必須です。'),
  nameJa: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  affiliation: z.string().min(1, '所属は必須です。'),
  affiliationRorId: rorIdentifierSchema.optional(),
  affiliationHierarchy: affiliationHierarchySchema.optional(),
  affiliationInstitution: z.string().min(1).optional(),
  affiliationGraduateSchool: z.string().min(1).optional(),
  affiliationFaculty: z.string().min(1).optional(),
  affiliationDepartment: z.string().min(1).optional(),
  affiliationMajor: z.string().min(1).optional(),
  affiliationLaboratory: z.string().min(1).optional(),
  role: z.enum(researchMemberRoleValues),
  email: z.string().email('メールアドレスの形式が正しくありません。'),
  orcid: orcidIdentifierSchema.optional(),
});

export type ResearchMemberInput = z.input<typeof researchMemberSchema>;
export type ResearchMember = z.infer<typeof researchMemberSchema>;

const responsibleRolePriority: Record<ResearchMemberRole, number> = {
  DATA_STEWARD: 0,
  PI: 1,
  CO_I: 2,
  STUDENT: 10,
  EXTERNAL_COLLABORATOR: 10,
};

export function createResearchMember(input: ResearchMemberInput): ResearchMember {
  return researchMemberSchema.parse(input);
}

export function getResearchMemberRoleLabel(role: ResearchMemberRole): string {
  return researchMemberRoleLabels[role];
}

export function getResearchMemberDisplayName(member: Pick<ResearchMember, 'name' | 'nameJa' | 'nameEn'>): string {
  const ja = member.nameJa ?? member.name;
  return member.nameEn ? `${ja} / ${member.nameEn}` : ja;
}

export function getResearchMemberAffiliationPath(
  member: Pick<
    ResearchMember,
    | 'affiliation'
    | 'affiliationHierarchy'
    | 'affiliationInstitution'
    | 'affiliationGraduateSchool'
    | 'affiliationFaculty'
    | 'affiliationDepartment'
    | 'affiliationMajor'
    | 'affiliationLaboratory'
  >,
): string {
  const hierarchy = member.affiliationHierarchy ?? {
    institution: member.affiliationInstitution ?? member.affiliation,
    graduateSchool: member.affiliationGraduateSchool,
    faculty: member.affiliationFaculty,
    department: member.affiliationDepartment,
    major: member.affiliationMajor,
    laboratory: member.affiliationLaboratory,
  };

  return [
    hierarchy.institution,
    hierarchy.graduateSchool,
    hierarchy.faculty,
    hierarchy.department,
    hierarchy.major,
    hierarchy.laboratory,
  ]
    .filter(Boolean)
    .join(' / ');
}

export function isDmpResponsibleCandidate(member: Pick<ResearchMember, 'role'>): boolean {
  return ['DATA_STEWARD', 'PI', 'CO_I'].includes(member.role);
}

export function getDmpResponsibleCandidates(members: ResearchMember[]): ResearchMember[] {
  return members
    .filter(isDmpResponsibleCandidate)
    .sort((left, right) => responsibleRolePriority[left.role] - responsibleRolePriority[right.role]);
}

export function getResearchMemberExternalIdentifiers(
  member: Pick<ResearchMember, 'id' | 'name' | 'affiliation' | 'orcid' | 'affiliationRorId'>,
): ExternalIdentifier[] {
  const identifiers: ExternalIdentifier[] = [];

  if (member.orcid) {
    identifiers.push(
      createResearcherOrcidIdentifier({
        entityId: member.id,
        name: member.name,
        orcid: member.orcid,
        connection: { status: 'oauth_ready', provider: 'orcid', scope: ['/read-limited'] },
      }),
    );
  }

  if (member.affiliationRorId) {
    const institution = createInstitutionRorIdentifier({
      id: `${member.id}-affiliation`,
      name: member.affiliation,
      rorId: member.affiliationRorId,
    });
    identifiers.push({
      id: `ror-${institution.id}`,
      type: 'ror',
      entityType: 'institution',
      entityId: institution.id,
      label: institution.name,
      value: institution.rorId,
      resolveUrl: `https://ror.org/${institution.rorId}`,
      connection: { status: 'manual', scope: [] },
    });
  }

  return identifiers;
}
