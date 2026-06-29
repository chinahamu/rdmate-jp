import { z } from 'zod';
import type { ResearchMember } from './research-member';
import type { ResearchProject } from './research-project';

export const japaneseNameSchema = z.object({
  ja: z.string().min(1, '日本語氏名は必須です。'),
  en: z.string().min(1, '英語氏名は必須です。'),
});

export type JapaneseName = z.infer<typeof japaneseNameSchema>;

export const affiliationHierarchySchema = z.object({
  institution: z.string().min(1, '研究機関名は必須です。'),
  graduateSchool: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  major: z.string().optional(),
  laboratory: z.string().optional(),
});

export type AffiliationHierarchy = z.infer<typeof affiliationHierarchySchema>;

export const japaneseInstitutionProfileSchema = z.object({
  memberId: z.string().min(1),
  name: japaneseNameSchema,
  affiliation: affiliationHierarchySchema,
  email: z.string().email(),
  role: z.string().min(1),
});

export type JapaneseInstitutionProfile = z.infer<typeof japaneseInstitutionProfileSchema>;

export const kakenhiProjectNumberPattern = /^\d{2}[A-ZK]\d{5}$/;

export type JapaneseInstitutionIssueSeverity = 'error' | 'warning' | 'info';

export type JapaneseInstitutionIssue = Readonly<{
  field: string;
  severity: JapaneseInstitutionIssueSeverity;
  message: string;
}>;

export type JapaneseInstitutionSummary = Readonly<{
  memberCount: number;
  bilingualNameCount: number;
  hierarchicalAffiliationCount: number;
  kakenhiFundingCount: number;
  validKakenhiProjectNumberCount: number;
  defaultDmpExportLanguage: 'ja';
  issues: JapaneseInstitutionIssue[];
}>;

export function createJapaneseName(input: JapaneseName): JapaneseName {
  return japaneseNameSchema.parse(input);
}

export function createAffiliationHierarchy(input: AffiliationHierarchy): AffiliationHierarchy {
  return affiliationHierarchySchema.parse(input);
}

export function createJapaneseInstitutionProfile(input: JapaneseInstitutionProfile): JapaneseInstitutionProfile {
  return japaneseInstitutionProfileSchema.parse(input);
}

export function formatBilingualName(name: Pick<JapaneseName, 'ja' | 'en'>): string {
  return `${name.ja} / ${name.en}`;
}

export function formatAffiliationHierarchy(affiliation: AffiliationHierarchy): string {
  return [
    affiliation.institution,
    affiliation.graduateSchool,
    affiliation.faculty,
    affiliation.department,
    affiliation.major,
    affiliation.laboratory,
  ]
    .filter(Boolean)
    .join(' / ');
}

export function inferAffiliationHierarchyFromText(affiliation: string): AffiliationHierarchy {
  const parts = affiliation.split(/[\s/／>＞]+/).filter(Boolean);
  const [institution = affiliation, second, third, fourth, fifth] = parts;

  return {
    institution,
    graduateSchool: second?.includes('研究科') ? second : undefined,
    faculty: second && !second.includes('研究科') ? second : third && !third.includes('専攻') ? third : undefined,
    department: third?.includes('学科') || third?.includes('部門') ? third : undefined,
    major: fourth?.includes('専攻') ? fourth : undefined,
    laboratory: fifth?.includes('研究室') ? fifth : undefined,
  };
}

export function getMemberJapaneseName(member: ResearchMember): JapaneseName | undefined {
  const ja = member.nameJa ?? member.name;
  const en = member.nameEn;
  if (!ja || !en) return undefined;

  return { ja, en };
}

export function getMemberAffiliationHierarchy(member: ResearchMember): AffiliationHierarchy | undefined {
  if (member.affiliationHierarchy) {
    return member.affiliationHierarchy;
  }

  if (
    member.affiliationInstitution ||
    member.affiliationGraduateSchool ||
    member.affiliationFaculty ||
    member.affiliationDepartment ||
    member.affiliationMajor ||
    member.affiliationLaboratory
  ) {
    return {
      institution: member.affiliationInstitution ?? member.affiliation,
      graduateSchool: member.affiliationGraduateSchool,
      faculty: member.affiliationFaculty,
      department: member.affiliationDepartment,
      major: member.affiliationMajor,
      laboratory: member.affiliationLaboratory,
    };
  }

  return undefined;
}

export function toJapaneseInstitutionProfile(member: ResearchMember): JapaneseInstitutionProfile {
  const name = getMemberJapaneseName(member) ?? { ja: member.name, en: member.name };
  const affiliation = getMemberAffiliationHierarchy(member) ?? inferAffiliationHierarchyFromText(member.affiliation);

  return createJapaneseInstitutionProfile({
    memberId: member.id,
    name,
    affiliation,
    email: member.email,
    role: member.role,
  });
}

export function isKakenhiProjectNumber(value: string | undefined): boolean {
  if (!value) return false;
  return kakenhiProjectNumberPattern.test(value.trim().toUpperCase());
}

export function normalizeKakenhiProjectNumber(value: string): string {
  return value.trim().replaceAll(/[\s-]/g, '').toUpperCase();
}

export function getKakenhiInputHints(value: string | undefined): string[] {
  if (!value) {
    return [
      '科研費の課題番号を入力してください。例: 26K00001',
      'ハイフンや空白は入力補助で除去できます。',
    ];
  }

  const normalized = normalizeKakenhiProjectNumber(value);
  if (isKakenhiProjectNumber(normalized)) {
    return [`科研費課題番号として扱えます: ${normalized}`];
  }

  return [
    `入力値 ${value} は科研費課題番号の標準形式例（26K00001など）と一致しません。`,
    `正規化候補: ${normalized}`,
  ];
}

export function createJapaneseDmpExportHeader(project: ResearchProject): string[] {
  const profiles = project.members.map(toJapaneseInstitutionProfile);
  const primaryInvestigator = profiles.find((profile) => profile.role === 'PI');
  const dataManager = profiles.find((profile) => profile.memberId === project.dataManagerMemberId);
  const kakenhiFunding = project.funding.filter((funding) => funding.agencyType === 'kakenhi');

  return [
    `# ${project.title}`,
    '',
    '| 項目 | 内容 |',
    '|---|---|',
    '| 出力言語 | 日本語 |',
    `| 研究分野 | ${project.field} |`,
    `| 研究期間 | ${project.startDate} - ${project.expectedEndDate} |`,
    `| 研究代表者 | ${primaryInvestigator ? formatBilingualName(primaryInvestigator.name) : '未設定'} |`,
    `| 研究データ管理責任者 | ${dataManager ? formatBilingualName(dataManager.name) : '未設定'} |`,
    `| 所属階層 | ${primaryInvestigator ? formatAffiliationHierarchy(primaryInvestigator.affiliation) : '未設定'} |`,
    `| 科研費課題番号 | ${kakenhiFunding.map((funding) => normalizeKakenhiProjectNumber(funding.projectNumber ?? '')).filter(Boolean).join('; ') || '未設定'} |`,
    '',
  ];
}

export function summarizeJapaneseInstitutionSupport(project: ResearchProject): JapaneseInstitutionSummary {
  const kakenhiFunding = project.funding.filter((funding) => funding.agencyType === 'kakenhi');
  const issues = validateJapaneseInstitutionSupport(project);

  return {
    memberCount: project.members.length,
    bilingualNameCount: project.members.filter((member) => getMemberJapaneseName(member)).length,
    hierarchicalAffiliationCount: project.members.filter((member) => getMemberAffiliationHierarchy(member)).length,
    kakenhiFundingCount: kakenhiFunding.length,
    validKakenhiProjectNumberCount: kakenhiFunding.filter((funding) =>
      isKakenhiProjectNumber(normalizeKakenhiProjectNumber(funding.projectNumber ?? '')),
    ).length,
    defaultDmpExportLanguage: 'ja',
    issues,
  };
}

export function validateJapaneseInstitutionSupport(project: ResearchProject): JapaneseInstitutionIssue[] {
  const issues: JapaneseInstitutionIssue[] = [];

  for (const member of project.members) {
    if (!getMemberJapaneseName(member)) {
      issues.push({
        field: `members.${member.id}.name`,
        severity: 'warning',
        message: `${member.name} は日本語氏名・英語氏名の併記が未設定です。`,
      });
    }

    if (!getMemberAffiliationHierarchy(member)) {
      issues.push({
        field: `members.${member.id}.affiliationHierarchy`,
        severity: 'info',
        message: `${member.name} は所属階層が未設定のため、所属文字列から推定します。`,
      });
    }
  }

  for (const funding of project.funding) {
    if (funding.agencyType !== 'kakenhi') continue;
    const normalized = normalizeKakenhiProjectNumber(funding.projectNumber ?? '');
    if (!isKakenhiProjectNumber(normalized)) {
      issues.push({
        field: `funding.${funding.id}.projectNumber`,
        severity: 'warning',
        message: `${funding.programName} の科研費課題番号を確認してください。入力値: ${funding.projectNumber ?? '未設定'}`,
      });
    }
  }

  if (project.preferredDmpLanguage && project.preferredDmpLanguage !== 'ja') {
    issues.push({
      field: 'preferredDmpLanguage',
      severity: 'warning',
      message: '日本の研究機関向け運用では、日本語DMP出力を標準にすることを推奨します。',
    });
  }

  return issues;
}

export function createJapaneseInstitutionDmpHints(project: ResearchProject): string[] {
  const kakenhiFunding = project.funding.filter((funding) => funding.agencyType === 'kakenhi');

  return [
    'DMP出力は日本語を既定とし、必要に応じて英語氏名を併記します。',
    '所属は「機関 / 研究科 / 学部 / 学科 / 専攻 / 研究室」の階層で確認します。',
    ...kakenhiFunding.flatMap((funding) => getKakenhiInputHints(funding.projectNumber)),
  ];
}
