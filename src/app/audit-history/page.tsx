import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { AuditHistoryDashboard } from '@/components/audit-history-dashboard';
import {
  getSampleAuditLogs,
  getSampleChangeHistory,
  getSampleExportComparisons,
  getSampleExportHistory,
} from '@/server/sample-audit-history';

export const metadata: Metadata = {
  title: '監査ログ・履歴管理 | RDMate JP',
};

export default function AuditHistoryPage() {
  const logs = getSampleAuditLogs();
  const changes = getSampleChangeHistory();
  const exports = getSampleExportHistory();
  const comparisons = getSampleExportComparisons();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Operations</p>
        <h1>監査ログ・履歴管理</h1>
        <p>
          研究課題、DMP、Dataset、公開判断、外部連携設定の操作ログと、DMP回答・メタデータ・出力ファイルの履歴を管理します。
        </p>
      </section>

      <AuditHistoryDashboard logs={logs} changes={changes} exports={exports} comparisons={comparisons} />
    </AppShell>
  );
}
