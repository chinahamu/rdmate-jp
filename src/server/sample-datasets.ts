import { createDataset } from '../domain/dataset';
import { getSampleResearchProject } from './sample-project';

export function getSampleDatasets() {
  const project = getSampleResearchProject();
  const dataManagerId = project.dataManagerMemberId;
  const piId = project.members.find((member) => member.role === 'PI')?.id ?? dataManagerId;

  return [
    createDataset({
      id: 'dataset-user-test-raw',
      projectId: project.id,
      name: 'DMP作成支援ユーザーテスト回答',
      description: '研究者向けユーザーテストで収集した回答データ。個人を識別できる列は別管理とする。',
      dataType: 'survey_data',
      generatedDate: '2026-06-01',
      lastUpdatedDate: '2026-06-10',
      version: '1.0.0',
      status: 'needs_action',
      createdBy: '佐藤 花子',
      responsibleMemberId: dataManagerId,
      storageLocations: [
        {
          id: 'storage-user-test-cloud',
          label: '大学提供クラウド',
          uri: 'https://storage.example.ac.jp/rdmate/user-test',
          storageType: 'cloud_url',
          accessScope: '研究代表者・データ管理担当者',
          hasBackup: true,
          isEncrypted: true,
        },
        {
          id: 'storage-user-test-gakunin-rdm',
          label: 'GakuNin RDM 実証研究プロジェクト',
          uri: 'https://rdm.nii.ac.jp/rdmate-demo/',
          storageType: 'gakunin_rdm_url',
          accessScope: '研究代表者・データ管理担当者・URA',
          hasBackup: true,
          isEncrypted: true,
          notes: 'Phase 3では公式APIに依存せず、GakuNin RDMプロジェクトURLを参照登録する。',
        },
      ],
      publicationStatus: 'restricted',
      plannedPublicationDate: '2027-04-30',
      license: 'Custom / Not specified',
      usageTerms: '匿名化済み集計データのみ申請制で共有する。',
      citation: 'RDMate JP 実証研究チーム (2026) DMP作成支援ユーザーテスト回答.',
    }),
    createDataset({
      id: 'dataset-ui-screenshots',
      projectId: project.id,
      name: 'UI評価スクリーンショット',
      description: 'DMP入力フォームとエクスポート画面の評価用スクリーンショット。',
      dataType: 'image_video',
      generatedDate: '2026-06-05',
      lastUpdatedDate: '2026-06-08',
      version: '0.9.0',
      status: 'unchecked',
      createdBy: '山田 太郎',
      responsibleMemberId: piId,
      storageLocations: [],
      publicationStatus: 'undecided',
    }),
    createDataset({
      id: 'dataset-analysis-code',
      projectId: project.id,
      name: '回答集計スクリプト',
      description: 'ユーザーテスト回答の集計・可視化に利用するTypeScriptスクリプト。',
      dataType: 'source_code',
      generatedDate: '2026-06-12',
      lastUpdatedDate: '2026-06-20',
      version: '1.1.0',
      status: 'ready',
      createdBy: '山田 太郎',
      responsibleMemberId: piId,
      storageLocations: [
        {
          id: 'storage-analysis-github',
          label: 'GitHubリポジトリ',
          uri: 'https://github.com/chinahamu/rdmate-jp/tree/main/scripts',
          storageType: 'github_url',
          accessScope: 'public予定',
          hasBackup: true,
          isEncrypted: false,
        },
      ],
      publicationStatus: 'open',
      plannedPublicationDate: '2027-04-01',
      publicUrl: 'https://github.com/chinahamu/rdmate-jp',
      doi: '10.1234/rdmate.demo.2026',
      license: 'MIT',
      usageTerms: 'MIT Licenseに従って利用可能。',
      citation: 'RDMate JP contributors (2026) User test analysis code.',
    }),
  ];
}
