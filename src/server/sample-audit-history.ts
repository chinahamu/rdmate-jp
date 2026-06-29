import {
  buildChangeDiff,
  compareExportHistory,
  createAuditLogEntry,
  createChangeHistoryEntry,
  createChangeHistoryFromDiff,
  createExportHistoryEntry,
  type AuditLogEntry,
  type ChangeHistoryEntry,
  type ExportHistoryComparison,
  type ExportHistoryEntry,
} from '@/domain/audit-history';

const projectId = 'sample-project';
const projectTitle = '研究データ管理支援ツールの実証研究';

const sampleAuditLogs = [
  createAuditLogEntry({
    id: 'audit-project-create',
    occurredAt: '2026-04-01T09:00:00+09:00',
    actorId: 'sample-pi',
    actorName: '山田 太郎',
    actorRole: 'PI',
    projectId,
    entityType: 'research_project',
    entityId: projectId,
    entityLabel: projectTitle,
    action: 'create',
    summary: '研究課題を作成しました。',
    metadata: { field: 'title' },
  }),
  createAuditLogEntry({
    id: 'audit-project-update',
    occurredAt: '2026-04-02T10:30:00+09:00',
    actorId: 'sample-pi',
    actorName: '山田 太郎',
    actorRole: 'PI',
    projectId,
    entityType: 'research_project',
    entityId: projectId,
    entityLabel: projectTitle,
    action: 'update',
    summary: '研究課題の概要と終了予定日を更新しました。',
    metadata: { fields: 'summary,expectedEndDate' },
  }),
  createAuditLogEntry({
    id: 'audit-project-delete',
    occurredAt: '2026-04-03T17:30:00+09:00',
    actorId: 'user-admin',
    actorName: '田中 管理',
    actorRole: 'ADMIN',
    entityType: 'research_project',
    entityId: 'archived-project',
    entityLabel: '旧版DMP移行テスト',
    action: 'delete',
    summary: '移行検証用の研究課題を削除しました。',
    metadata: { deleteMode: 'logical' },
  }),
  createAuditLogEntry({
    id: 'audit-dmp-create',
    occurredAt: '2026-04-04T11:00:00+09:00',
    actorId: 'sample-data-steward',
    actorName: '佐藤 花子',
    actorRole: 'DATA_STEWARD',
    projectId,
    entityType: 'dmp',
    entityId: 'dmp-sample-v1',
    entityLabel: 'DMP初版',
    action: 'create',
    summary: 'DMP回答を初期作成しました。',
    metadata: { templateId: 'basic-research-jp-v1' },
  }),
  createAuditLogEntry({
    id: 'audit-dmp-update',
    occurredAt: '2026-04-05T13:20:00+09:00',
    actorId: 'sample-data-steward',
    actorName: '佐藤 花子',
    actorRole: 'DATA_STEWARD',
    projectId,
    entityType: 'dmp',
    entityId: 'dmp-sample-v1',
    entityLabel: 'DMP初版',
    action: 'update',
    summary: 'DMPの公開方針と保存期間を更新しました。',
    metadata: { fields: 'sharingPolicy,retentionPeriod' },
  }),
  createAuditLogEntry({
    id: 'audit-dmp-export',
    occurredAt: '2026-04-05T15:00:00+09:00',
    actorId: 'sample-data-steward',
    actorName: '佐藤 花子',
    actorRole: 'DATA_STEWARD',
    projectId,
    entityType: 'dmp',
    entityId: 'dmp-sample-v1',
    entityLabel: 'DMP初版',
    action: 'export',
    summary: 'DMPをMarkdownでエクスポートしました。',
    metadata: { format: 'markdown', exportHistoryId: 'export-dmp-markdown-v1' },
  }),
  createAuditLogEntry({
    id: 'audit-dataset-create',
    occurredAt: '2026-04-06T10:00:00+09:00',
    actorId: 'user-member',
    actorName: '鈴木 研究',
    actorRole: 'MEMBER',
    projectId,
    entityType: 'dataset',
    entityId: 'dataset-survey-2026',
    entityLabel: '研究者アンケート回答データ',
    action: 'create',
    summary: 'データセット台帳に新規データセットを登録しました。',
    metadata: { dataType: 'survey_data' },
  }),
  createAuditLogEntry({
    id: 'audit-dataset-update',
    occurredAt: '2026-04-07T14:15:00+09:00',
    actorId: 'sample-data-steward',
    actorName: '佐藤 花子',
    actorRole: 'DATA_STEWARD',
    projectId,
    entityType: 'dataset',
    entityId: 'dataset-survey-2026',
    entityLabel: '研究者アンケート回答データ',
    action: 'update',
    summary: 'メタデータ、保存場所、責任者を更新しました。',
    metadata: { fields: 'metadata,storageLocation,responsibleMemberId' },
  }),
  createAuditLogEntry({
    id: 'audit-dataset-delete',
    occurredAt: '2026-04-08T16:20:00+09:00',
    actorId: 'sample-data-steward',
    actorName: '佐藤 花子',
    actorRole: 'DATA_STEWARD',
    projectId,
    entityType: 'dataset',
    entityId: 'dataset-dummy',
    entityLabel: 'ダミーデータ投入テスト',
    action: 'delete',
    summary: '検証用データセットを削除しました。',
    metadata: { deleteMode: 'logical' },
  }),
  createAuditLogEntry({
    id: 'audit-publication-change',
    occurredAt: '2026-04-09T09:45:00+09:00',
    actorId: 'sample-pi',
    actorName: '山田 太郎',
    actorRole: 'PI',
    projectId,
    entityType: 'publication_license',
    entityId: 'dataset-survey-2026-publication',
    entityLabel: '研究者アンケート回答データ 公開判断',
    action: 'change_publication',
    summary: '公開区分をundecidedからrestrictedに変更しました。',
    metadata: { before: 'undecided', after: 'restricted' },
  }),
  createAuditLogEntry({
    id: 'audit-license-change',
    occurredAt: '2026-04-09T10:00:00+09:00',
    actorId: 'sample-pi',
    actorName: '山田 太郎',
    actorRole: 'PI',
    projectId,
    entityType: 'publication_license',
    entityId: 'dataset-survey-2026-publication',
    entityLabel: '研究者アンケート回答データ 公開判断',
    action: 'change_license',
    summary: 'ライセンスを未設定からCC BY 4.0に変更しました。',
    metadata: { before: 'not_specified', after: 'CC BY 4.0' },
  }),
  createAuditLogEntry({
    id: 'audit-integration-change',
    occurredAt: '2026-04-10T11:30:00+09:00',
    actorId: 'user-admin',
    actorName: '田中 管理',
    actorRole: 'ADMIN',
    projectId,
    entityType: 'external_integration',
    entityId: 'gakunin-rdm-sample-project',
    entityLabel: 'GakuNin RDM連携',
    action: 'change_integration',
    summary: 'GakuNin RDM連携先URLと同期対象を更新しました。',
    metadata: { provider: 'gakunin_rdm', scope: 'metadata,dataset' },
  }),
] satisfies AuditLogEntry[];

const dmpChanges = createChangeHistoryFromDiff(
  buildChangeDiff(
    {
      sharingPolicy: '未定',
      retentionPeriod: '研究終了後3年',
    },
    {
      sharingPolicy: '制限付き公開。利用申請を受け付ける。',
      retentionPeriod: '研究終了後5年',
    },
    {
      sharingPolicy: '公開・共有方針',
      retentionPeriod: '保存期間',
    },
  ),
  {
    entityType: 'dmp_answer',
    entityId: 'dmp-sample-v1',
    projectId,
    changedBy: '佐藤 花子',
    changedAt: '2026-04-05T13:20:00+09:00',
    versionTag: 'dmp-v1.1.0',
    reason: '研究代表者レビューを反映',
  },
);

const datasetMetadataChanges = [
  createChangeHistoryEntry({
    id: 'change-dataset-title',
    entityType: 'dataset_metadata',
    entityId: 'dataset-survey-2026',
    projectId,
    field: 'title',
    fieldLabel: 'タイトル',
    beforeValue: 'アンケート回答',
    afterValue: '研究者アンケート回答データ',
    changedBy: '佐藤 花子',
    changedAt: '2026-04-07T14:15:00+09:00',
    versionTag: 'dataset-metadata-v1.1.0',
    reason: 'リポジトリ登録前チェックでタイトルを具体化',
  }),
  createChangeHistoryEntry({
    id: 'change-dataset-keywords',
    entityType: 'dataset_metadata',
    entityId: 'dataset-survey-2026',
    projectId,
    field: 'keywords',
    fieldLabel: 'キーワード',
    beforeValue: 'DMP',
    afterValue: 'DMP, RDM, 研究データ管理, アンケート',
    changedBy: '佐藤 花子',
    changedAt: '2026-04-07T14:16:00+09:00',
    versionTag: 'dataset-metadata-v1.1.0',
  }),
] satisfies ChangeHistoryEntry[];

const sampleChangeHistory = [...dmpChanges, ...datasetMetadataChanges] satisfies ChangeHistoryEntry[];

const sampleExportHistory = [
  createExportHistoryEntry({
    id: 'export-dmp-markdown-v1',
    projectId,
    projectTitle,
    exportedBy: '佐藤 花子',
    exportedAt: '2026-04-05T15:00:00+09:00',
    format: 'markdown',
    fileName: 'sample-project-dmp-v1.md',
    outputHash: 'sha256:7e3d0f91a2b45c6d78e90f1234567890abcdef1234567890abcdef1234567890',
    itemCount: 24,
  }),
  createExportHistoryEntry({
    id: 'export-dmp-markdown-v2',
    projectId,
    projectTitle,
    exportedBy: '佐藤 花子',
    exportedAt: '2026-04-07T15:00:00+09:00',
    format: 'markdown',
    fileName: 'sample-project-dmp-v2.md',
    outputHash: 'sha256:9a8b7c61d2e34f5a67890b1234567890abcdef1234567890abcdef1234567890',
    itemCount: 26,
    previousExportId: 'export-dmp-markdown-v1',
  }),
  createExportHistoryEntry({
    id: 'export-complete-json-v1',
    projectId,
    projectTitle,
    exportedBy: '田中 管理',
    exportedAt: '2026-04-10T12:00:00+09:00',
    format: 'json',
    fileName: 'sample-project-complete-export.json',
    outputHash: 'sha256:0f1e2d3c4b5a69788796a5b4c3d2e1f00123456789abcdef0123456789abcdef',
    itemCount: 58,
  }),
] satisfies ExportHistoryEntry[];

const sampleExportComparisons = [
  compareExportHistory(sampleExportHistory[0], sampleExportHistory[1]),
] satisfies ExportHistoryComparison[];

export function getSampleAuditLogs(): AuditLogEntry[] {
  return sampleAuditLogs;
}

export function getSampleChangeHistory(): ChangeHistoryEntry[] {
  return sampleChangeHistory;
}

export function getSampleExportHistory(): ExportHistoryEntry[] {
  return sampleExportHistory;
}

export function getSampleExportComparisons(): ExportHistoryComparison[] {
  return sampleExportComparisons;
}
