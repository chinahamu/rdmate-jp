import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import {
  getRepositoryExportFormatLabel,
  getSampleRepositoryExportBundle,
  getSampleRepositoryExportContext,
} from '@/server/repository-exports';

export const metadata: Metadata = {
  title: 'リポジトリ出力 | RDMate JP',
};

export default function RepositoryExportsPage() {
  const context = getSampleRepositoryExportContext();
  const exports = getSampleRepositoryExportBundle();
  const preview = exports.find((item) => item.format === 'datacite_json') ?? exports[0];

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Repository Export</p>
        <h1>機関リポジトリ・公開基盤向け出力</h1>
        <p>
          DataCite風JSON、JAIRO Cloud想定CSV、Dataverse JSON風、Zenodo metadata JSON風を、Phase 3ではファイル出力として生成します。
        </p>
      </section>

      <section className="card quality-summary" aria-label="リポジトリ出力対象">
        <div>
          <p className="eyebrow">Dataset</p>
          <h2>{context.dataset.name}</h2>
          <p>{context.metadata.description}</p>
        </div>
        <dl className="quality-counts">
          <div>
            <dt>作成者</dt>
            <dd>{context.metadata.creators.length}</dd>
          </div>
          <div>
            <dt>関連成果物</dt>
            <dd>{context.metadata.relatedPapers.length + context.metadata.relatedSoftware.length}</dd>
          </div>
          <div>
            <dt>助成</dt>
            <dd>{context.project.funding.length}</dd>
          </div>
        </dl>
      </section>

      <section className="storage-reference-grid" aria-label="出力形式一覧">
        {exports.map((item) => (
          <article key={item.format} className="card storage-reference-card">
            <div className="template-card__header">
              <div>
                <p className="eyebrow">{item.mimeType}</p>
                <h2>{getRepositoryExportFormatLabel(item.format)}</h2>
              </div>
              <a className="secondary-button" href={`/api/repository-exports/${item.format}`}>
                保存
              </a>
            </div>
            <p>{item.fileName}</p>
            <code>{item.format}</code>
          </article>
        ))}
      </section>

      {preview ? (
        <section className="card dataset-import-export" aria-label="出力プレビュー">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{getRepositoryExportFormatLabel(preview.format)}</h2>
            <p>関連論文・関連コード・助成金・ライセンス・権利情報を含むリポジトリ提出用プレビューです。</p>
          </div>
          <textarea readOnly aria-label="リポジトリ出力プレビュー" value={preview.content} />
        </section>
      ) : null}
    </AppShell>
  );
}
