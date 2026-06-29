import {
  auditActionLabels,
  auditEntityTypeLabels,
  changeHistoryEntityTypeLabels,
  exportFormatLabels,
  summarizeAuditHistory,
  type AuditLogEntry,
  type ChangeHistoryEntry,
  type ExportHistoryComparison,
  type ExportHistoryEntry,
} from '@/domain/audit-history';

type AuditHistoryDashboardProps = Readonly<{
  logs: AuditLogEntry[];
  changes: ChangeHistoryEntry[];
  exports: ExportHistoryEntry[];
  comparisons: ExportHistoryComparison[];
}>;

export function AuditHistoryDashboard({ logs, changes, exports, comparisons }: AuditHistoryDashboardProps) {
  const summary = summarizeAuditHistory(logs, changes, exports);

  return (
    <>
      <section className="card audit-history-summary" aria-label="監査ログ履歴管理サマリー">
        <div>
          <p className="eyebrow">Audit Log & History</p>
          <h2>監査ログ・履歴管理</h2>
          <p>
            研究課題、DMP、Dataset、公開判断、外部連携設定の操作を監査ログとして残し、
            DMP回答・Datasetメタデータの変更差分とエクスポート履歴を追跡します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div><dt>監査ログ</dt><dd>{summary.auditLogCount}</dd></div>
          <div><dt>変更履歴</dt><dd>{summary.changeHistoryCount}</dd></div>
          <div><dt>出力履歴</dt><dd>{summary.exportHistoryCount}</dd></div>
        </dl>
      </section>

      <section className="audit-history-card-grid" aria-label="監査対象別件数">
        {Object.entries(summary.countsByEntityType).map(([entityType, count]) => (
          <article key={entityType} className="card audit-history-card">
            <p className="eyebrow">{entityType}</p>
            <h2>{auditEntityTypeLabels[entityType as keyof typeof auditEntityTypeLabels]}</h2>
            <strong>{count}件</strong>
          </article>
        ))}
      </section>

      <section className="card audit-history-table-section" aria-label="監査ログ一覧">
        <div>
          <p className="eyebrow">Audit Trail</p>
          <h2>監査ログ</h2>
          <p>作成・更新・削除・出力・公開区分/ライセンス/外部連携変更を時系列に表示します。</p>
          <a className="secondary-button" href="/api/audit-history/summary">監査履歴JSONを表示</a>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>操作</th>
                <th>対象</th>
                <th>操作者</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.occurredAt)}</td>
                  <td>{auditActionLabels[log.action]}</td>
                  <td><strong>{auditEntityTypeLabels[log.entityType]}</strong><span>{log.entityLabel}</span></td>
                  <td>{log.actorName}<span>{log.actorRole ?? log.actorId}</span></td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="audit-history-card-grid" aria-label="変更履歴一覧">
        {changes.map((change) => (
          <article key={change.id} className="card audit-history-card">
            <div className="template-card__header">
              <div>
                <p className="eyebrow">{changeHistoryEntityTypeLabels[change.entityType]}</p>
                <h2>{change.fieldLabel}</h2>
              </div>
              <strong>{change.versionTag ?? 'no tag'}</strong>
            </div>
            <dl className="metadata-detail-list">
              <div><dt>変更者</dt><dd>{change.changedBy}</dd></div>
              <div><dt>変更日時</dt><dd>{formatDateTime(change.changedAt)}</dd></div>
            </dl>
            <div className="audit-history-diff">
              <div><span>変更前</span><p>{change.beforeValue ?? '未設定'}</p></div>
              <div><span>変更後</span><p>{change.afterValue ?? '未設定'}</p></div>
            </div>
            {change.reason ? <p className="audit-history-note">理由: {change.reason}</p> : null}
          </article>
        ))}
      </section>

      <section className="card audit-history-table-section" aria-label="エクスポート履歴">
        <div>
          <p className="eyebrow">Export History</p>
          <h2>エクスポート履歴</h2>
          <p>誰が、いつ、どの形式で、どの研究課題を出力したかと、出力ファイルのハッシュを記録します。</p>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>形式</th>
                <th>研究課題</th>
                <th>出力者</th>
                <th>ファイル / ハッシュ</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.exportedAt)}</td>
                  <td>{exportFormatLabels[entry.format]}</td>
                  <td>{entry.projectTitle}<span>{entry.itemCount}件</span></td>
                  <td>{entry.exportedBy}</td>
                  <td><strong>{entry.fileName}</strong><code>{entry.outputHash}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="audit-history-card-grid" aria-label="再出力差分">
        {comparisons.map((comparison) => (
          <article key={`${comparison.previousExportId}-${comparison.currentExportId}`} className="card audit-history-card" data-status={comparison.status}>
            <p className="eyebrow">Export Diff</p>
            <h2>{comparison.status === 'same_hash' ? '差分なし' : '差分あり'}</h2>
            <p>{comparison.summary}</p>
            <dl className="metadata-detail-list">
              <div><dt>前回出力</dt><dd>{comparison.previousExportId}</dd></div>
              <div><dt>今回出力</dt><dd>{comparison.currentExportId}</dd></div>
              <div><dt>件数差分</dt><dd>{comparison.itemCountDelta}</dd></div>
              <div><dt>ハッシュ</dt><dd>{comparison.hashChanged ? '変更あり' : '同一'}</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}
