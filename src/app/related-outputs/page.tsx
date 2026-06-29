import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { RelatedOutputsDashboard } from '@/components/related-outputs-dashboard';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSampleRelatedOutputExport } from '@/server/sample-related-outputs';
import { getSampleResearchProject } from '@/server/sample-project';

export const metadata: Metadata = {
  title: '関連成果物の紐付け | RDMate JP',
};

export default function RelatedOutputsPage() {
  const project = getSampleResearchProject();
  const datasets = getSampleDatasets();
  const exportData = getSampleRelatedOutputExport();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>関連成果物の紐付け</h1>
        <p>
          Datasetと論文・発表、ソフトウェア/コード、実験・調査手順を紐付け、成果物の識別子、関係種別、変更履歴を管理します。
        </p>
      </section>

      <RelatedOutputsDashboard project={project} datasets={datasets} exportData={exportData} />
    </AppShell>
  );
}
