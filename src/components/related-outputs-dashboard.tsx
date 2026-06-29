import type { Dataset } from '@/domain/dataset';
import {
  groupRelatedOutputsByDataset,
  relatedOutputKindLabels,
  relatedOutputRelationLabels,
  type RelatedOutput,
  type RelatedOutputExport,
  type RelatedOutputIssue,
} from '@/domain/related-output';
import type { ResearchProject } from '@/domain/research-project';

type RelatedOutputsDashboardProps = Readonly<{
  datasets: Dataset[];
  exportData: RelatedOutputExport;
  project: ResearchProject;
}>;

export function RelatedOutputsDashboard({ datasets, exportData, project }: RelatedOutputsDashboardProps) {
  const groups = groupRelatedOutputsByDataset(exportData.outputs);

  return (
    <>
      <section className="card related-output-summary" aria-label="関連成果物サマリー">
        <div>
          <p className="eyebrow">Related Outputs</p>
          <h2>Datasetと成果物の紐付け</h2>
          <p>
            論文・発表、ソフトウェア/コード、実験・調査手順をDatasetに紐付け、使用・生成・補足・再解析などの関係を管理します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div>
            <dt>成果物</dt>
            <dd>{exportData.summary.total}</dd>
          </div>
          <div>
            <dt>コード</dt>
            <dd>{exportData.summary.softwareCount}</dd>
          </div>
          <div>
            <dt>課題</dt>
            <dd>{exportData.summary.issueCount}</dd>
          </div>
        </dl>
      </section>

      <section className="related-output-grid" aria-label="Dataset別関連成果物">
        {datasets.map((dataset) => {
          const outputs = groups[dataset.id] ?? [];
          const issues = exportData.issues.filter((issue) => issue.datasetId === dataset.id);

          return (
            <article key={dataset.id} className="card related-output-card">
              <div className="template-card__header">
                <div>
                  <p className="eyebrow">{dataset.dataType}</p>
                  <h2>{dataset.name}</h2>
                </div>
                <strong>{outputs.length}件</strong>
              </div>

              {outputs.length > 0 ? (
                <ul className="related-output-list">
                  {outputs.map((output) => (
                    <RelatedOutputItem key={output.id} output={output} project={project} />
                  ))}
                </ul>
              ) : (
                <p className="dataset-muted">関連成果物は未登録です。</p>
              )}

              {issues.length > 0 ? <RelatedOutputIssues issues={issues} /> : <p className="metadata-ok">関連成果物チェックを通過しました。</p>}
            </article>
          );
        })}
      </section>

      <section className="card related-output-export" aria-label="関連成果物エクスポート">
        <div>
          <p className="eyebrow">Export</p>
          <h2>関連成果物JSON / CSV</h2>
          <p>Datasetとの関係種別、識別子、リリースタグ、実行環境、プロトコル変更履歴を出力できます。</p>
          <div className="dataset-ledger-actions">
            <a className="secondary-button" href="/api/related-outputs/export/json">
              JSONを表示
            </a>
            <a className="secondary-button" href="/api/related-outputs/export/csv">
              CSVを保存
            </a>
          </div>
        </div>
        <textarea readOnly aria-label="関連成果物JSONプレビュー" value={JSON.stringify(exportData, null, 2)} />
      </section>
    </>
  );
}

function RelatedOutputItem({ output, project }: Readonly<{ output: RelatedOutput; project: ResearchProject }>) {
  const responsible = project.members.find((member) => member.id === output.responsibleMemberId);

  return (
    <li>
      <div className="template-card__header">
        <div>
          <strong>{output.title}</strong>
          <span>{relatedOutputKindLabels[output.kind]} / {relatedOutputRelationLabels[output.relation]}</span>
        </div>
        {output.publicationYear ? <em>{output.publicationYear}</em> : null}
      </div>
      <dl className="metadata-detail-list">
        <div>
          <dt>識別子</dt>
          <dd>{output.doi ?? output.arxivId ?? output.protocolId ?? output.releaseTag ?? '未設定'}</dd>
        </div>
        <div>
          <dt>URL</dt>
          <dd>{output.url ?? output.arxivUrl ?? output.repositoryUrl ?? output.protocolUrl ?? '未設定'}</dd>
        </div>
        <div>
          <dt>ライセンス/実行環境</dt>
          <dd>{[output.license, output.runtimeEnvironment].filter(Boolean).join(' / ') || '未設定'}</dd>
        </div>
        <div>
          <dt>責任者</dt>
          <dd>{responsible?.name ?? output.responsibleMemberId ?? '未設定'}</dd>
        </div>
      </dl>
      {output.changeHistory.length > 0 ? (
        <details>
          <summary>プロトコル変更履歴 {output.changeHistory.length}件</summary>
          <ul className="related-output-change-list">
            {output.changeHistory.map((change) => (
              <li key={change.id}>
                <strong>{change.version}</strong>
                <span>{change.changedAt}: {change.summary}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

function RelatedOutputIssues({ issues }: Readonly<{ issues: RelatedOutputIssue[] }>) {
  return (
    <ul className="dataset-issue-list">
      {issues.map((issue) => (
        <li key={`${issue.outputId}-${issue.field}-${issue.message}`} data-severity={issue.severity}>
          {issue.message}
        </li>
      ))}
    </ul>
  );
}
