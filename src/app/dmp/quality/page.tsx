import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DmpQualityResults } from '@/components/dmp-quality-results';
import { createDmpQualityReport } from '@/domain/dmp-quality';
import { getSampleDmpExportContext } from '@/server/dmp-export-sample';

export const metadata: Metadata = {
  title: 'DMPチェック | RDMate JP',
};

export default function DmpQualityPage() {
  const context = getSampleDmpExportContext();
  const report = createDmpQualityReport(context.template, context.project, context.answers);

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">DMP Quality</p>
        <h1>DMPチェック</h1>
        <p>
          必須項目、保存場所、公開区分、ライセンス、責任者、保持期間、個人情報・外部共有・知財リスクを確認します。
        </p>
      </section>

      <section className="card dmp-editor-summary" aria-label="チェック対象">
        <div>
          <p className="eyebrow">Project</p>
          <h2>{context.project.title}</h2>
          <p>{context.template.name} v{context.template.version}</p>
        </div>
      </section>

      <DmpQualityResults report={report} />
    </AppShell>
  );
}
