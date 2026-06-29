import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import {
  generateDmpCsv,
  generateDmpJson,
  generateDmpMarkdown,
  getDmpExportFileName,
} from '@/domain/dmp-export';
import { getSampleDmpExportContext } from '@/server/dmp-export-sample';

export const metadata: Metadata = {
  title: 'DMPエクスポート | RDMate JP',
};

const exportFormats = [
  { extension: 'md', label: 'Markdown' },
  { extension: 'json', label: 'JSON' },
  { extension: 'csv', label: 'CSV' },
  { extension: 'docx', label: 'DOCX' },
] as const;

export default function DmpExportPage() {
  const context = getSampleDmpExportContext();
  const markdown = generateDmpMarkdown(context);
  const json = generateDmpJson(context);
  const csv = generateDmpCsv(context);

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">DMP Export</p>
        <h1>DMPエクスポート</h1>
        <p>
          入力済みDMPをMarkdown / JSON / CSV / DOCXで出力します。Markdownはプレビュー表示でき、JSONは将来のインポートに使える完全データ形式です。
        </p>
      </section>

      <section className="card export-summary" aria-label="エクスポート対象">
        <div>
          <p className="eyebrow">Project</p>
          <h2>{context.project.title}</h2>
          <p>{context.template.name} v{context.template.version}</p>
        </div>
        <div className="export-actions" aria-label="保存形式">
          {exportFormats.map((format) => (
            <a key={format.extension} className="secondary-button" href={`/api/export/${format.extension}`}>
              {format.label}を保存
            </a>
          ))}
        </div>
      </section>

      <section className="export-preview-grid">
        <article className="card export-preview">
          <div className="template-card__header">
            <div>
              <p className="eyebrow">Markdown Preview</p>
              <h2>Markdownプレビュー</h2>
            </div>
            <code>{getDmpExportFileName(context, 'md')}</code>
          </div>
          <pre>{markdown}</pre>
        </article>

        <article className="card export-preview">
          <div className="template-card__header">
            <div>
              <p className="eyebrow">JSON</p>
              <h2>JSON出力</h2>
            </div>
            <code>{getDmpExportFileName(context, 'json')}</code>
          </div>
          <pre>{json}</pre>
        </article>

        <article className="card export-preview">
          <div className="template-card__header">
            <div>
              <p className="eyebrow">CSV</p>
              <h2>CSV出力</h2>
            </div>
            <code>{getDmpExportFileName(context, 'csv')}</code>
          </div>
          <pre>{csv}</pre>
        </article>
      </section>
    </AppShell>
  );
}
