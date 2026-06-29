import {
  createRelatedOutput,
  createRelatedOutputExport,
  type RelatedOutput,
  type RelatedOutputExport,
} from '../domain/related-output';
import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';

export function getSampleRelatedOutputs(): RelatedOutput[] {
  const project = getSampleResearchProject();
  const dataManagerId = project.dataManagerMemberId;
  const piId = project.members.find((member) => member.role === 'PI')?.id ?? dataManagerId;

  return [
    createRelatedOutput({
      id: 'output-rdm-workflow-paper',
      datasetId: 'dataset-user-test-raw',
      kind: 'paper',
      relation: 'supplements_dataset',
      title: 'Research data management workflow for Japanese laboratories',
      doi: '10.1234/rdm.workflow.2026',
      journalName: 'Journal of Research Data Practice',
      publicationYear: '2026',
      notes: '匿名化済み集計データを補足資料として参照する。',
    }),
    createRelatedOutput({
      id: 'output-rdm-presentation',
      datasetId: 'dataset-ui-screenshots',
      kind: 'presentation',
      relation: 'uses_dataset',
      title: 'DMP作成支援UIの評価結果',
      url: 'https://example.ac.jp/rdmate/presentation/2026',
      publicationYear: '2026',
      notes: 'UI評価スクリーンショットを発表スライドで使用する。',
    }),
    createRelatedOutput({
      id: 'output-analysis-code',
      datasetId: 'dataset-user-test-raw',
      kind: 'software',
      relation: 'analyzes_dataset',
      title: 'RDMate JP user test analysis scripts',
      repositoryUrl: 'https://github.com/chinahamu/rdmate-jp',
      releaseTag: 'v0.2.0-rdm-lite',
      license: 'MIT',
      runtimeEnvironment: 'Node.js 22 / pnpm / TypeScript',
      notes: 'ユーザーテスト回答の集計と可視化に利用する解析コード。',
    }),
    createRelatedOutput({
      id: 'output-visualization-code',
      datasetId: 'dataset-analysis-code',
      kind: 'software',
      relation: 'visualizes_dataset',
      title: 'DMP completion dashboard renderer',
      repositoryUrl: 'https://github.com/chinahamu/rdmate-jp/tree/main/scripts',
      releaseTag: 'v0.2.0-rdm-lite',
      license: 'MIT',
      runtimeEnvironment: 'Next.js / React / TypeScript',
    }),
    createRelatedOutput({
      id: 'output-user-test-protocol',
      datasetId: 'dataset-user-test-raw',
      kind: 'protocol',
      relation: 'documents_protocol',
      title: 'DMP作成支援ユーザーテスト手順書',
      protocolId: 'RDMATE-UT-2026-001',
      protocolUrl: 'https://example.ac.jp/protocols/rdmate-ut-2026-001',
      version: '1.1.0',
      responsibleMemberId: dataManagerId,
      changeHistory: [
        {
          id: 'change-ut-001',
          changedAt: '2026-05-20',
          version: '1.0.0',
          changedBy: piId,
          summary: '初版作成。',
        },
        {
          id: 'change-ut-002',
          changedAt: '2026-06-03',
          version: '1.1.0',
          changedBy: dataManagerId,
          summary: '回答者属性の取り扱い説明を追記。',
        },
      ],
      notes: 'ユーザーテスト実施条件とデータ取り扱い手順を記録する。',
    }),
  ];
}

export function getSampleRelatedOutputExport(generatedAt = '2026-06-29T00:00:00.000Z'): RelatedOutputExport {
  const project = getSampleResearchProject();
  return createRelatedOutputExport(getSampleRelatedOutputs(), getSampleDatasets(), project, generatedAt);
}
