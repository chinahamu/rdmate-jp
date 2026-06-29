import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { getSampleCodeRepositoryDashboard, getReproducibilityStatusLabel } from '@/server/code-repository-integration';

export const metadata: Metadata = {
  title: 'GitHub/GitLab連携 | RDMate JP',
};

export default function CodeRepositoriesPage() {
  const dashboard = getSampleCodeRepositoryDashboard();
  const firstComment = dashboard.prComments[0] ?? '';

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Code Repository Integration</p>
        <h1>GitHub/GitLab連携</h1>
        <p>
          研究課題にコードリポジトリを紐付け、リポジトリ名・URL・ライセンス・主要ブランチ・リリースタグ・成果物関係を管理します。
          README、LICENSE、実行環境、データ取得手順、固定バージョンの再現性チェックも確認できます。
        </p>
      </section>

      <section className="storage-reference-grid" aria-label="コードリポジトリ一覧">
        {dashboard.repositories.map((repository) => {
          const report = dashboard.reports.find((candidate) => candidate.repositoryId === repository.id);

          return (
            <article key={repository.id} className="card storage-reference-card">
              <div className="template-card__header">
                <div>
                  <p className="eyebrow">{repository.provider}</p>
                  <h2>{repository.name}</h2>
                </div>
                <a className="secondary-button" href={repository.url}>
                  repository
                </a>
              </div>
              <dl className="dataset-ledger-stats">
                <div>
                  <dt>License</dt>
                  <dd>{repository.license ?? '未設定'}</dd>
                </div>
                <div>
                  <dt>Branch</dt>
                  <dd>{repository.defaultBranch}</dd>
                </div>
                <div>
                  <dt>Tags</dt>
                  <dd>{repository.releaseTags.join(', ') || '未設定'}</dd>
                </div>
              </dl>
              <p>Commit: {repository.commitHash ?? '未固定'}</p>
              <h3>成果物関係</h3>
              <ul className="dataset-issue-list">
                {repository.relations.map((relation) => (
                  <li key={relation.id} data-severity="info">
                    {relation.relationType}: {relation.datasetId ?? relation.paperId ?? relation.softwareId} — {relation.description}
                  </li>
                ))}
              </ul>
              {report ? (
                <div>
                  <h3>再現性チェック: {getReproducibilityStatusLabel(report.status)} ({report.score}/100)</h3>
                  <ul className="dataset-issue-list">
                    {report.items.map((item) => (
                      <li key={item.id} data-severity={item.status === 'passed' ? 'info' : 'warning'}>
                        {item.label}: {item.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="card dataset-import-export" aria-label="RDMate CLI metadata JSON">
        <div>
          <p className="eyebrow">RDMate CLI</p>
          <h2>rdmate validate --format json</h2>
          <p>GitHub ActionsやGitLab CIで検証結果を扱えるJSON形式です。</p>
          <a className="secondary-button" href="/api/code-repositories/sample">
            JSON API
          </a>
        </div>
        <textarea readOnly aria-label="RDMate CLI metadata JSON" value={JSON.stringify(dashboard.cliMetadataJson, null, 2)} />
      </section>

      <section className="card dataset-import-export" aria-label="GitHub Actions workflow">
        <div>
          <p className="eyebrow">GitHub Actions</p>
          <h2>RDMate Validate workflow</h2>
          <p>Pull Requestで `rdmate validate` を実行し、再現性チェック結果をPRコメントに出す拡張の雛形です。</p>
        </div>
        <textarea readOnly aria-label="GitHub Actions workflow" value={dashboard.githubActionsWorkflow} />
      </section>

      <section className="card dataset-import-export" aria-label="PR comment preview">
        <div>
          <p className="eyebrow">PR Comment</p>
          <h2>再現性チェックPRコメント</h2>
          <p>PRコメント本文として使えるMarkdownプレビューです。</p>
        </div>
        <textarea readOnly aria-label="PR comment preview" value={firstComment} />
      </section>
    </AppShell>
  );
}
