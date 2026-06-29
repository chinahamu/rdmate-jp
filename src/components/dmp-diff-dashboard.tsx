import type { DmpDiffIssue, DmpDiffReport } from '@/domain/dmp-diff';

type DmpDiffDashboardProps = Readonly<{
  report: DmpDiffReport;
}>;

export function DmpDiffDashboard({ report }: DmpDiffDashboardProps) {
  const dmpUpdateIssues = report.issues.filter((issue) => issue.actionTarget === 'dmp_update');
  const datasetUpdateIssues = report.issues.filter((issue) => issue.actionTarget === 'dataset_update');

  return (
    <>
      <section className="card dmp-diff-summary" aria-label="DMP差分サマリー">
        <div>
          <p className="eyebrow">DMP Difference Check</p>
          <h2>プロジェクト単位の差分レポート</h2>
          <p>
            DMPで宣言したデータ種別、保存場所、公開方針、保持期間・廃棄方針、責任者と、Dataset台帳の実態を比較します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div>
            <dt>エラー</dt>
            <dd>{report.summary.errorCount}</dd>
          </div>
          <div>
            <dt>警告</dt>
            <dd>{report.summary.warningCount}</dd>
          </div>
          <div>
            <dt>情報</dt>
            <dd>{report.summary.infoCount}</dd>
          </div>
        </dl>
      </section>

      <section className="card dmp-policy-card" aria-label="DMP抽出方針">
        <div>
          <p className="eyebrow">Extracted Policy</p>
          <h2>DMPから抽出した方針</h2>
          <p>DMP回答を機械的に読み取り、Datasetとの比較に使う方針値へ変換します。</p>
        </div>
        <dl className="metadata-detail-list">
          <div>
            <dt>予定データ種別</dt>
            <dd>{report.policy.plannedDataTypes.join(' / ') || '未設定'}</dd>
          </div>
          <div>
            <dt>保存場所</dt>
            <dd>{report.policy.storageKeywords.join(' / ') || '未設定'}</dd>
          </div>
          <div>
            <dt>公開方針</dt>
            <dd>{report.policy.publicationStatuses.join(' / ') || '未設定'}</dd>
          </div>
          <div>
            <dt>保持期間</dt>
            <dd>{report.policy.retentionPolicy ?? '未設定'}</dd>
          </div>
          <div>
            <dt>廃棄方針</dt>
            <dd>{report.policy.disposalPolicy ?? '未設定'}</dd>
          </div>
          <div>
            <dt>責任者</dt>
            <dd>{report.policy.responsibleParties.join(' / ') || '未設定'}</dd>
          </div>
        </dl>
      </section>

      <section className="dmp-diff-grid" aria-label="差分分類">
        <DiffIssuePanel title="DMPを更新すべき項目" issues={dmpUpdateIssues} emptyMessage="DMP更新候補はありません。" />
        <DiffIssuePanel title="Datasetを修正すべき項目" issues={datasetUpdateIssues} emptyMessage="Dataset修正候補はありません。" />
      </section>

      <section className="card dmp-diff-export" aria-label="DMP差分エクスポート">
        <div>
          <p className="eyebrow">Export</p>
          <h2>Markdown / CSV / JSON 出力</h2>
          <p>差分レポートをレビューや共有に使える形式で出力できます。</p>
          <div className="dataset-ledger-actions">
            <a className="secondary-button" href="/api/dmp-diff/report/markdown">
              Markdownを保存
            </a>
            <a className="secondary-button" href="/api/dmp-diff/report/csv">
              CSVを保存
            </a>
            <a className="secondary-button" href="/api/dmp-diff/report/json">
              JSONを表示
            </a>
          </div>
        </div>
        <textarea readOnly aria-label="DMP差分JSONプレビュー" value={JSON.stringify(report, null, 2)} />
      </section>
    </>
  );
}

function DiffIssuePanel({
  title,
  issues,
  emptyMessage,
}: Readonly<{
  title: string;
  issues: DmpDiffIssue[];
  emptyMessage: string;
}>) {
  return (
    <article className="card dmp-diff-panel">
      <div className="template-card__header">
        <h2>{title}</h2>
        <strong>{issues.length}件</strong>
      </div>
      {issues.length > 0 ? (
        <ul className="dataset-issue-list">
          {issues.map((issue) => (
            <li key={issue.id} data-severity={issue.severity}>
              <strong>{issue.datasetName ?? 'Project'}</strong>
              <span>{issue.message}</span>
              <small>DMP: {issue.dmpValue} / Dataset: {issue.datasetValue}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="metadata-ok">{emptyMessage}</p>
      )}
    </article>
  );
}
