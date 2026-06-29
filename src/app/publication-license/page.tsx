import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { PublicationLicenseDashboard } from '@/components/publication-license-dashboard';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSamplePublicationDecisions } from '@/server/sample-publication-license';

export const metadata: Metadata = {
  title: '公開区分・ライセンス管理 | RDMate JP',
};

export default function PublicationLicensePage() {
  const datasets = getSampleDatasets();
  const decisions = getSamplePublicationDecisions();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>公開区分・ライセンス管理</h1>
        <p>
          データセットの公開区分、公開予定日、ライセンス、利用条件、非公開理由、契約・知財・PII観点の確認を管理します。
        </p>
      </section>

      <PublicationLicenseDashboard datasets={datasets} decisions={decisions} />
    </AppShell>
  );
}
