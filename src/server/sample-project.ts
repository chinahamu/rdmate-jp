import { createCodeRepositoryFromUrl } from '../domain/code-repository';
import { createFunding } from '../domain/funding';
import { createResearchMember } from '../domain/research-member';
import { createResearchProject } from '../domain/research-project';

export function getSampleResearchProject() {
  const pi = createResearchMember({
    id: 'sample-pi',
    name: '山田 太郎',
    nameJa: '山田 太郎',
    nameEn: 'Taro Yamada',
    affiliation: 'メタ大学 情報学部 情報システム学科 研究データ管理研究室',
    affiliationRorId: '03yrm5c26',
    affiliationHierarchy: {
      institution: 'メタ大学',
      faculty: '情報学部',
      department: '情報システム学科',
      laboratory: '研究データ管理研究室',
    },
    role: 'PI',
    email: 'taro.yamada@example.ac.jp',
    orcid: '0000-0002-1825-0097',
  });
  const dataSteward = createResearchMember({
    id: 'sample-data-steward',
    name: '佐藤 花子',
    nameJa: '佐藤 花子',
    nameEn: 'Hanako Sato',
    affiliation: 'メタ大学 附属図書館 研究データ支援部門',
    affiliationRorId: '03yrm5c26',
    affiliationHierarchy: {
      institution: 'メタ大学',
      faculty: '附属図書館',
      department: '研究データ支援部門',
    },
    role: 'DATA_STEWARD',
    email: 'hanako.sato@example.ac.jp',
  });

  return createResearchProject({
    id: 'sample-project',
    title: '研究データ管理支援ツールの実証研究',
    summary: 'DMP作成支援ツールのMVP検証を行う。',
    field: '情報学',
    startDate: '2026-04-01',
    expectedEndDate: '2027-03-31',
    projectNumber: 'RP-2026-001',
    institutionLocalProjectCode: 'META-RDM-2026-001',
    preferredDmpLanguage: 'ja',
    members: [pi, dataSteward],
    funding: [
      createFunding({
        id: 'sample-funding',
        agencyName: '日本学術振興会',
        agencyType: 'kakenhi',
        programName: '科学研究費助成事業',
        projectNumber: '26K00001',
        grantNumber: '26K00001',
        fiscalYear: '2026',
        period: {
          startDate: '2026-04-01',
          endDate: '2029-03-31',
        },
        url: 'https://www.jsps.go.jp/',
      }),
    ],
    codeRepositories: [
      createCodeRepositoryFromUrl({
        id: 'repo-rdmate-jp',
        name: 'rdmate-jp',
        url: 'https://github.com/chinahamu/rdmate-jp',
        license: 'MIT',
        defaultBranch: 'main',
        releaseTags: ['v0.1.0'],
        commitHash: '455a3463a18a0be873766e73fbf8a60cb27156cd',
        filePresence: {
          readme: true,
          license: true,
          requirements: false,
          environment: true,
          dockerfile: false,
          dataAcquisitionInstructions: true,
        },
        relations: [
          {
            id: 'repo-dataset-analysis-code',
            relationType: 'is_source_of',
            datasetId: 'dataset-analysis-code',
            description: '回答集計スクリプトのソースコードリポジトリ。',
          },
          {
            id: 'repo-paper-workflow',
            relationType: 'is_supplement_to',
            paperId: 'paper-rdm-workflow-2026',
            description: 'RDM workflow paper の補足コード。',
          },
          {
            id: 'repo-software-rdmate',
            relationType: 'documents',
            softwareId: 'software-rdmate-jp',
            description: 'RDMate JP ソフトウェア成果物。',
          },
        ],
      }),
    ],
    dataManagerMemberId: dataSteward.id,
  });
}
