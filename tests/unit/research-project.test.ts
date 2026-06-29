import { describe, expect, it } from 'vitest';
import {
  createResearchProject,
  getCoResearchers,
  getDataManager,
  getDmpResponsibleMemberCandidates,
  getPrimaryInvestigator,
  getProjectAffiliations,
  isProjectPeriodValid,
} from '../../src/domain/research-project';

const members = [
  {
    id: 'member-pi',
    name: '山田 太郎',
    affiliation: 'メタ大学 情報学部',
    role: 'PI' as const,
    email: 'taro.yamada@example.ac.jp',
    orcid: '0000-0002-1825-0097',
  },
  {
    id: 'member-data-steward',
    name: '佐藤 花子',
    affiliation: 'メタ大学 図書館',
    role: 'DATA_STEWARD' as const,
    email: 'hanako.sato@example.ac.jp',
  },
  {
    id: 'member-coi',
    name: '田中 次郎',
    affiliation: '共同研究機構',
    role: 'CO_I' as const,
    email: 'jiro.tanaka@example.org',
  },
];

const funding = [
  {
    id: 'funding-1',
    agencyName: '日本学術振興会',
    agencyType: 'kakenhi' as const,
    programName: '科学研究費助成事業',
    projectNumber: '26K00001',
    fiscalYear: '2026',
    period: {
      startDate: '2026-04-01',
      endDate: '2029-03-31',
    },
    url: 'https://www.jsps.go.jp/',
  },
];

describe('research project domain', () => {
  it('creates a draft project with members, funding, and a data manager', () => {
    const project = createResearchProject({
      id: 'project-1',
      title: '研究データ管理の実証研究',
      summary: 'DMP作成支援ツールのMVP検証',
      field: '情報学',
      startDate: '2026-04-01',
      expectedEndDate: '2027-03-31',
      projectNumber: 'RP-2026-001',
      members,
      funding,
      dataManagerMemberId: 'member-data-steward',
    });

    expect(project.status).toBe('draft');
    expect(project.projectNumber).toBe('RP-2026-001');
    expect(project.funding[0]?.projectNumber).toBe('26K00001');
    expect(getDataManager(project)?.name).toBe('佐藤 花子');
  });

  it('derives PI, co-researchers, affiliations, and DMP responsible candidates', () => {
    const project = createResearchProject({
      id: 'project-1',
      title: '研究データ管理の実証研究',
      summary: 'DMP作成支援ツールのMVP検証',
      field: '情報学',
      startDate: '2026-04-01',
      expectedEndDate: '2027-03-31',
      members,
      funding,
      dataManagerMemberId: 'member-data-steward',
    });

    expect(getPrimaryInvestigator(project)?.id).toBe('member-pi');
    expect(getCoResearchers(project).map((member) => member.id)).toEqual([
      'member-data-steward',
      'member-coi',
    ]);
    expect(getProjectAffiliations(project)).toEqual([
      'メタ大学 図書館',
      'メタ大学 情報学部',
      '共同研究機構',
    ]);
    expect(getDmpResponsibleMemberCandidates(project).map((member) => member.id)).toEqual([
      'member-data-steward',
      'member-pi',
      'member-coi',
    ]);
  });

  it('validates chronological project periods', () => {
    expect(
      isProjectPeriodValid({
        startDate: '2026-04-01',
        expectedEndDate: '2027-03-31',
      }),
    ).toBe(true);

    expect(
      isProjectPeriodValid({
        startDate: '2027-04-01',
        expectedEndDate: '2027-03-31',
      }),
    ).toBe(false);
  });

  it('rejects projects without a registered data manager', () => {
    expect(() =>
      createResearchProject({
        id: 'project-1',
        title: '研究データ管理の実証研究',
        summary: 'DMP作成支援ツールのMVP検証',
        field: '情報学',
        startDate: '2026-04-01',
        expectedEndDate: '2027-03-31',
        members,
        funding,
        dataManagerMemberId: 'missing-member',
      }),
    ).toThrow('研究データ管理責任者は登録済みメンバーから選択してください。');
  });
});
