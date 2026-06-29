import { describe, expect, it } from 'vitest';
import { createDataset } from '../../src/domain/dataset';
import {
  applyProjectMetadataAutofill,
  calculateMetadataCompletion,
  createDatasetMetadata,
  getKeywordCandidates,
  getRdmateMetadataJsonSchema,
  toDataCiteMetadata,
  toDublinCoreMetadata,
  validateRepositoryMetadata,
} from '../../src/domain/metadata';
import { createFunding } from '../../src/domain/funding';
import { createResearchMember } from '../../src/domain/research-member';
import { createResearchProject } from '../../src/domain/research-project';

const pi = createResearchMember({
  id: 'member-pi',
  name: '山田 太郎',
  affiliation: 'メタ大学 情報学部',
  role: 'PI',
  email: 'taro.yamada@example.ac.jp',
  orcid: '0000-0002-1825-0097',
});

const dataSteward = createResearchMember({
  id: 'member-data-steward',
  name: '佐藤 花子',
  affiliation: 'メタ大学 図書館',
  role: 'DATA_STEWARD',
  email: 'hanako.sato@example.ac.jp',
});

const project = createResearchProject({
  id: 'project-1',
  title: '研究データ管理支援ツールの実証研究',
  summary: 'DMP作成支援ツールのMVP検証を行う。',
  field: '情報学',
  startDate: '2026-04-01',
  expectedEndDate: '2027-03-31',
  members: [pi, dataSteward],
  funding: [
    createFunding({
      id: 'funding-1',
      agencyName: '日本学術振興会',
      agencyType: 'kakenhi',
      programName: '科学研究費助成事業',
    }),
  ],
  dataManagerMemberId: dataSteward.id,
});

const dataset = createDataset({
  id: 'dataset-1',
  projectId: project.id,
  name: 'DMP作成支援ユーザーテスト回答',
  description: '研究者向けユーザーテストで収集した回答データ。',
  dataType: 'survey_data',
  generatedDate: '2026-06-01',
  lastUpdatedDate: '2026-06-10',
  version: '1.0.0',
  status: 'ready',
  createdBy: '佐藤 花子',
  responsibleMemberId: dataSteward.id,
  publicationStatus: 'restricted',
  license: 'Custom / Not specified',
  storageLocations: [
    {
      id: 'storage-1',
      label: '大学提供クラウド',
      uri: 'https://storage.example.ac.jp/rdmate/user-test',
      storageType: 'cloud_url',
      accessScope: '研究代表者・データ管理担当者',
      hasBackup: true,
      isEncrypted: true,
    },
  ],
});

describe('metadata management domain', () => {
  it('creates dataset metadata with required and recommended fields', () => {
    const metadata = createDatasetMetadata({
      datasetId: dataset.id,
      title: dataset.name,
      description: dataset.description,
      creators: [{ name: dataSteward.name, affiliation: dataSteward.affiliation }],
      keywords: ['DMP', '研究データ管理'],
      researchField: project.field,
      acquisitionMethod: 'ユーザーテストフォームから収集',
      temporalCoverage: { startDate: '2026-06-01', endDate: '2026-06-10' },
      spatialCoverage: { placeName: '日本' },
      variables: [
        {
          id: 'variable-respondent-id',
          name: 'respondent_id',
          description: '匿名化済み回答者ID。',
          dataType: 'string',
        },
      ],
      relatedPapers: [
        {
          id: 'paper-1',
          title: 'RDM workflow paper',
          doi: '10.1234/rdm.workflow.2026',
        },
      ],
      relatedSoftware: [
        {
          id: 'software-1',
          name: 'RDMate JP',
          url: 'https://github.com/chinahamu/rdmate-jp',
        },
      ],
    });

    expect(metadata.creators[0]?.affiliation).toBe('メタ大学 図書館');
    expect(metadata.variables[0]?.name).toBe('respondent_id');
    expect(calculateMetadataCompletion(metadata).score).toBe(100);
  });

  it('autofills metadata from project, member, funding, and dataset information', () => {
    const metadata = applyProjectMetadataAutofill(dataset, project);

    expect(metadata.title).toBe(dataset.name);
    expect(metadata.creators[0]?.name).toBe(dataSteward.name);
    expect(metadata.publisher).toBe('日本学術振興会');
    expect(metadata.keywords).toContain('情報学');
    expect(metadata.variables.map((variable) => variable.name)).toContain('respondent_id');
  });

  it('detects missing repository metadata fields and exposes keyword candidates', () => {
    const metadata = createDatasetMetadata({
      datasetId: dataset.id,
      title: dataset.name,
      description: dataset.description,
      creators: [{ name: dataSteward.name, affiliation: dataSteward.affiliation }],
      keywords: ['DMP'],
      researchField: project.field,
      acquisitionMethod: 'ユーザーテストフォームから収集',
    });
    const issues = validateRepositoryMetadata(metadata);
    const candidates = getKeywordCandidates(project, [dataset], [metadata]);

    expect(issues.map((issue) => issue.field)).toEqual(['temporalCoverage', 'spatialCoverage', 'variables']);
    expect(candidates).toContain('DMP');
    expect(candidates).toContain('survey_data');
  });

  it('maps metadata to Dublin Core and DataCite-like JSON', () => {
    const metadata = applyProjectMetadataAutofill(dataset, project);
    const dublinCore = toDublinCoreMetadata(metadata, dataset);
    const dataCite = toDataCiteMetadata(metadata, dataset);

    expect(dublinCore.title).toBe(dataset.name);
    expect(dublinCore.creator).toEqual([dataSteward.name]);
    expect(dataCite.resourceType.resourceTypeGeneral).toBe('Dataset');
    expect(dataCite.creators[0]?.nameIdentifiers).toBeUndefined();
  });

  it('publishes an RDMate metadata JSON schema', () => {
    const schema = getRdmateMetadataJsonSchema();

    expect(schema.required).toContain('datasetId');
    expect(schema.properties.creators.type).toBe('array');
  });
});
