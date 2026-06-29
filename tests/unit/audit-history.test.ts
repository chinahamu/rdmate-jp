import { describe, expect, it } from 'vitest';
import {
  auditActionValues,
  auditEntityTypeValues,
  buildChangeDiff,
  compareExportHistory,
  createAuditLogEntry,
  createChangeHistoryFromDiff,
  createExportHistoryEntry,
  filterAuditLogs,
  getLatestExportForProject,
  summarizeAuditHistory,
} from '../../src/domain/audit-history';

const projectId = 'project-1';

const projectCreated = createAuditLogEntry({
  id: 'audit-project-created',
  occurredAt: '2026-04-01T09:00:00+09:00',
  actorId: 'user-pi',
  actorName: '山田 太郎',
  actorRole: 'PI',
  projectId,
  entityType: 'research_project',
  entityId: projectId,
  entityLabel: '研究課題A',
  action: 'create',
  summary: '研究課題を作成しました。',
  metadata: {},
});

const datasetUpdated = createAuditLogEntry({
  id: 'audit-dataset-updated',
  occurredAt: '2026-04-02T10:00:00+09:00',
  actorId: 'user-steward',
  actorName: '佐藤 花子',
  actorRole: 'DATA_STEWARD',
  projectId,
  entityType: 'dataset',
  entityId: 'dataset-1',
  entityLabel: '調査データ',
  action: 'update',
  summary: 'Datasetメタデータを更新しました。',
  metadata: { field: 'title' },
});

const dmpExported = createAuditLogEntry({
  id: 'audit-dmp-exported',
  occurredAt: '2026-04-03T11:00:00+09:00',
  actorId: 'user-steward',
  actorName: '佐藤 花子',
  actorRole: 'DATA_STEWARD',
  projectId,
  entityType: 'dmp',
  entityId: 'dmp-1',
  entityLabel: 'DMP v1',
  action: 'export',
  summary: 'DMPをエクスポートしました。',
  metadata: { format: 'markdown' },
});

const firstExport = createExportHistoryEntry({
  id: 'export-1',
  projectId,
  projectTitle: '研究課題A',
  exportedBy: '佐藤 花子',
  exportedAt: '2026-04-03T11:00:00+09:00',
  format: 'markdown',
  fileName: 'dmp-v1.md',
  outputHash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
  itemCount: 20,
});

const secondExport = createExportHistoryEntry({
  id: 'export-2',
  projectId,
  projectTitle: '研究課題A',
  exportedBy: '佐藤 花子',
  exportedAt: '2026-04-04T11:00:00+09:00',
  format: 'markdown',
  fileName: 'dmp-v2.md',
  outputHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
  itemCount: 22,
  previousExportId: 'export-1',
});

describe('audit history domain', () => {
  it('defines audit target entities and operations', () => {
    expect(auditEntityTypeValues).toEqual([
      'research_project',
      'dmp',
      'dataset',
      'publication_license',
      'external_integration',
    ]);
    expect(auditActionValues).toContain('change_publication');
    expect(auditActionValues).toContain('change_integration');
  });

  it('filters audit logs by entity type and action', () => {
    const logs = [projectCreated, datasetUpdated, dmpExported];

    expect(filterAuditLogs(logs, { entityType: 'dataset' })).toEqual([datasetUpdated]);
    expect(filterAuditLogs(logs, { action: 'export' })).toEqual([dmpExported]);
  });

  it('builds before and after diffs for DMP answers or metadata', () => {
    const diff = buildChangeDiff(
      { sharingPolicy: '未定', retentionPeriod: '3年' },
      { sharingPolicy: '制限付き公開', retentionPeriod: '5年' },
      { sharingPolicy: '公開方針', retentionPeriod: '保存期間' },
    );

    expect(diff).toEqual([
      { field: 'retentionPeriod', fieldLabel: '保存期間', beforeValue: '3年', afterValue: '5年' },
      { field: 'sharingPolicy', fieldLabel: '公開方針', beforeValue: '未定', afterValue: '制限付き公開' },
    ]);
  });

  it('creates version-tagged change history from a diff', () => {
    const changes = createChangeHistoryFromDiff(
      [{ field: 'title', fieldLabel: 'タイトル', beforeValue: '旧', afterValue: '新' }],
      {
        entityType: 'dataset_metadata',
        entityId: 'dataset-1',
        projectId,
        changedBy: '佐藤 花子',
        changedAt: '2026-04-02T10:00:00+09:00',
        versionTag: 'dataset-metadata-v1.1.0',
      },
    );

    expect(changes[0]?.versionTag).toBe('dataset-metadata-v1.1.0');
    expect(changes[0]?.beforeValue).toBe('旧');
  });

  it('compares export histories by hash and item count', () => {
    const comparison = compareExportHistory(firstExport, secondExport);

    expect(comparison.hashChanged).toBe(true);
    expect(comparison.formatChanged).toBe(false);
    expect(comparison.itemCountDelta).toBe(2);
    expect(comparison.status).toBe('changed_hash');
  });

  it('summarizes audit logs, change history, and export history', () => {
    const changes = createChangeHistoryFromDiff(
      [{ field: 'title', fieldLabel: 'タイトル', beforeValue: '旧', afterValue: '新' }],
      {
        entityType: 'dataset_metadata',
        entityId: 'dataset-1',
        projectId,
        changedBy: '佐藤 花子',
        changedAt: '2026-04-02T10:00:00+09:00',
      },
    );
    const summary = summarizeAuditHistory(
      [projectCreated, datasetUpdated, dmpExported],
      changes,
      [firstExport, secondExport],
    );

    expect(summary.auditLogCount).toBe(3);
    expect(summary.changeHistoryCount).toBe(1);
    expect(summary.exportHistoryCount).toBe(2);
    expect(summary.countsByEntityType.dataset).toBe(1);
    expect(summary.countsByAction.export).toBe(1);
    expect(summary.latestEventAt).toBe('2026-04-03T11:00:00+09:00');
  });

  it('finds the latest export for a project', () => {
    expect(getLatestExportForProject([firstExport, secondExport], projectId)?.id).toBe('export-2');
  });
});
