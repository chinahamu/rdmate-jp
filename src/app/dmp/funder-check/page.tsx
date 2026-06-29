import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { FunderCheckResults } from '@/components/funder-check-results';
import { createSampleFunderCheckReport } from '@/server/funder-check-rules';

export const metadata: Metadata = {
  title: '助成機関別DMPチェック | RDMate JP',
};

export default function FunderCheckPage() {
  const report = createSampleFunderCheckReport();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Funder-specific Rules</p>
        <h1>助成機関別DMPチェック</h1>
        <p>
          JST、AMED、科研費、学内助成を想定したJSON定義ルールで、必須・推奨・条件付き・禁止項目を確認します。
        </p>
      </section>

      <section className="card dmp-editor-summary" aria-label="チェック対象">
        <div>
          <p className="eyebrow">Project / Template</p>
          <h2>{report.templateName}</h2>
          <p>
            ルールセット: {report.ruleSetName} / 対象テンプレート: {report.templateId}
          </p>
        </div>
      </section>

      <FunderCheckResults report={report} />
    </AppShell>
  );
}
