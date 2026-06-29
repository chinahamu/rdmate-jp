import { z } from 'zod';

export const auditEntityTypeValues = [
  'research_project',
  'dmp',
  'dataset',
  'publication_license',
  'external_integration',
] as const;

export type AuditEntityType = (typeof auditEntityTypeValues)[number];

export const auditEntityTypeLabels: Record<AuditEntityType, string> = {
  research_project: '研究課題',
  dmp: 'DMP',
  dataset: 'データセット',
  publication_license: '公開区分・ライセンス',
  external_integration: '外部連携設定',
};

export const auditActionValues = [
  'create',
  'update',
  'delete',
  'export',
  'change_publication',
  'change_license',
  'change_integration',
] as const;

export type AuditAction = (typeof auditActionValues)[number];

export const auditActionLabels: Record<AuditAction, string> = {
  create: '作成',
  update: '更新',
  delete: '削除',
  export: 'エクスポート',
  change_publication: '公開区分変更',
  change_license: 'ライセンス変更',
  change_integration: '外部連携設定変更',
};

export const changeHistoryEntityTypeValues = ['dmp_answer', 'dataset_metadata'] as const;

export type ChangeHistoryEntityType = (typeof changeHistoryEntityTypeValues)[number];

export const changeHistoryEntityTypeLabels: Record<ChangeHistoryEntityType, string> = {
  dmp_answer: 'DMP回答',
  dataset_metadata: 'データセットメタデータ',
};

export const exportFormatValues = ['json', 'csv', 'markdown', 'docx', 'pdf', 'zip'] as const;

export type ExportFormat = (typeof exportFormatValues)[number];

export const exportFormatLabels: Record<ExportFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  markdown: 'Markdown',
  docx: 'Word',
  pdf: 'PDF',
  zip: 'ZIP',
};

const dateTimeStringSchema = z.string().datetime({ offset: true });

const metadataSchema = z.record(z.string()).default({});

export const auditLogEntrySchema = z.object({
  id: z.string().min(1),
  occurredAt: dateTimeStringSchema,
  actorId: z.string().min(1),
  actorName: z.string().min(1),
  actorRole: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  entityType: z.enum(auditEntityTypeValues),
  entityId: z.string().min(1),
  entityLabel: z.string().min(1),
  action: z.enum(auditActionValues),
  summary: z.string().min(1),
  metadata: metadataSchema,
});

export type AuditLogEntryInput = z.input<typeof auditLogEntrySchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const changeHistoryEntrySchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(changeHistoryEntityTypeValues),
  entityId: z.string().min(1),
  projectId: z.string().min(1),
  field: z.string().min(1),
  fieldLabel: z.string().min(1),
  beforeValue: z.string().optional(),
  afterValue: z.string().optional(),
  changedBy: z.string().min(1),
  changedAt: dateTimeStringSchema,
  versionTag: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
});

export type ChangeHistoryEntryInput = z.input<typeof changeHistoryEntrySchema>;
export type ChangeHistoryEntry = z.infer<typeof changeHistoryEntrySchema>;

export const exportHistoryEntrySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  projectTitle: z.string().min(1),
  exportedBy: z.string().min(1),
  exportedAt: dateTimeStringSchema,
  format: z.enum(exportFormatValues),
  fileName: z.string().min(1),
  outputHash: z.string().min(16, '出力ファイルのハッシュを記録してください。'),
  itemCount: z.number().int().nonnegative().default(0),
  previousExportId: z.string().min(1).optional(),
});

export type ExportHistoryEntryInput = z.input<typeof exportHistoryEntrySchema>;
export type ExportHistoryEntry = z.infer<typeof exportHistoryEntrySchema>;

export type AuditFilterCriteria = Readonly<{
  projectId?: string;
  entityType?: AuditEntityType;
  action?: AuditAction;
  actorId?: string;
}>;

export type ChangeDiff = Readonly<{
  field: string;
  fieldLabel: string;
  beforeValue?: string;
  afterValue?: string;
}>;

export type ExportHistoryComparison = Readonly<{
  previousExportId: string;
  currentExportId: string;
  status: 'same_hash' | 'changed_hash' | 'different_format';
  hashChanged: boolean;
  formatChanged: boolean;
  itemCountDelta: number;
  summary: string;
}>;

export type AuditHistorySummary = Readonly<{
  auditLogCount: number;
  changeHistoryCount: number;
  exportHistoryCount: number;
  countsByEntityType: Record<AuditEntityType, number>;
  countsByAction: Record<AuditAction, number>;
  latestEventAt?: string;
}>;

export function createAuditLogEntry(input: AuditLogEntryInput): AuditLogEntry {
  return auditLogEntrySchema.parse(input);
}

export function createChangeHistoryEntry(input: ChangeHistoryEntryInput): ChangeHistoryEntry {
  return changeHistoryEntrySchema.parse(input);
}

export function createExportHistoryEntry(input: ExportHistoryEntryInput): ExportHistoryEntry {
  return exportHistoryEntrySchema.parse(input);
}

export function filterAuditLogs(logs: AuditLogEntry[], criteria: AuditFilterCriteria): AuditLogEntry[] {
  return logs.filter((log) => {
    if (criteria.projectId && log.projectId !== criteria.projectId) return false;
    if (criteria.entityType && log.entityType !== criteria.entityType) return false;
    if (criteria.action && log.action !== criteria.action) return false;
    if (criteria.actorId && log.actorId !== criteria.actorId) return false;

    return true;
  });
}

export function buildChangeDiff(
  before: Record<string, string | undefined>,
  after: Record<string, string | undefined>,
  labels: Record<string, string> = {},
): ChangeDiff[] {
  const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );

  return fields
    .filter((field) => normalizeValue(before[field]) !== normalizeValue(after[field]))
    .map((field) => ({
      field,
      fieldLabel: labels[field] ?? field,
      beforeValue: before[field],
      afterValue: after[field],
    }));
}

export function createChangeHistoryFromDiff(
  diff: ChangeDiff[],
  base: Omit<ChangeHistoryEntryInput, 'id' | 'field' | 'fieldLabel' | 'beforeValue' | 'afterValue'>,
): ChangeHistoryEntry[] {
  return diff.map((change, index) =>
    createChangeHistoryEntry({
      ...base,
      id: `${base.entityId}-${change.field}-${index + 1}`,
      field: change.field,
      fieldLabel: change.fieldLabel,
      beforeValue: change.beforeValue,
      afterValue: change.afterValue,
    }),
  );
}

export function compareExportHistory(
  previous: ExportHistoryEntry,
  current: ExportHistoryEntry,
): ExportHistoryComparison {
  const formatChanged = previous.format !== current.format;
  const hashChanged = previous.outputHash !== current.outputHash;
  const itemCountDelta = current.itemCount - previous.itemCount;
  const status = formatChanged ? 'different_format' : hashChanged ? 'changed_hash' : 'same_hash';

  return {
    previousExportId: previous.id,
    currentExportId: current.id,
    status,
    hashChanged,
    formatChanged,
    itemCountDelta,
    summary: formatExportComparisonSummary({ status, hashChanged, formatChanged, itemCountDelta }),
  };
}

export function summarizeAuditHistory(
  logs: AuditLogEntry[],
  changes: ChangeHistoryEntry[],
  exports: ExportHistoryEntry[],
): AuditHistorySummary {
  const countsByEntityType = auditEntityTypeValues.reduce((counts, entityType) => {
    counts[entityType] = logs.filter((log) => log.entityType === entityType).length;
    return counts;
  }, {} as Record<AuditEntityType, number>);
  const countsByAction = auditActionValues.reduce((counts, action) => {
    counts[action] = logs.filter((log) => log.action === action).length;
    return counts;
  }, {} as Record<AuditAction, number>);
  const latestEventAt = logs
    .map((log) => log.occurredAt)
    .sort((left, right) => (left < right ? 1 : left > right ? -1 : 0))[0];

  return {
    auditLogCount: logs.length,
    changeHistoryCount: changes.length,
    exportHistoryCount: exports.length,
    countsByEntityType,
    countsByAction,
    latestEventAt,
  };
}

export function getLatestExportForProject(
  exports: ExportHistoryEntry[],
  projectId: string,
): ExportHistoryEntry | undefined {
  return exports
    .filter((entry) => entry.projectId === projectId)
    .sort((left, right) => (left.exportedAt < right.exportedAt ? 1 : left.exportedAt > right.exportedAt ? -1 : 0))[0];
}

function normalizeValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function formatExportComparisonSummary(
  comparison: Pick<ExportHistoryComparison, 'status' | 'hashChanged' | 'formatChanged' | 'itemCountDelta'>,
): string {
  if (comparison.formatChanged) {
    return '出力形式が前回と異なるため、ファイル単位での差分確認が必要です。';
  }

  if (!comparison.hashChanged) {
    return '出力ファイルのハッシュは前回と同一です。';
  }

  if (comparison.itemCountDelta > 0) {
    return `前回より${comparison.itemCountDelta}件多い出力です。内容差分を確認してください。`;
  }

  if (comparison.itemCountDelta < 0) {
    return `前回より${Math.abs(comparison.itemCountDelta)}件少ない出力です。削除またはフィルタ条件を確認してください。`;
  }

  return '件数は同じですが、出力ファイルのハッシュが変化しています。内容差分を確認してください。';
}
