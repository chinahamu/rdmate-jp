import { filterAuditLogs, summarizeAuditHistory } from '@/domain/audit-history';
import {
  getSampleAuditLogs,
  getSampleChangeHistory,
  getSampleExportComparisons,
  getSampleExportHistory,
} from '@/server/sample-audit-history';

export function GET() {
  const logs = getSampleAuditLogs();
  const changes = getSampleChangeHistory();
  const exports = getSampleExportHistory();
  const comparisons = getSampleExportComparisons();
  const summary = summarizeAuditHistory(logs, changes, exports);

  return Response.json({
    schemaVersion: '1.0.0',
    summary,
    auditLogs: logs,
    dmpAuditLogs: filterAuditLogs(logs, { entityType: 'dmp' }),
    datasetAuditLogs: filterAuditLogs(logs, { entityType: 'dataset' }),
    changeHistory: changes,
    exportHistory: exports,
    exportComparisons: comparisons,
  });
}
