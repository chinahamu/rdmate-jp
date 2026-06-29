import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DmpDiffDashboard } from '@/components/dmp-diff-dashboard';
import { getSampleDmpDiffReport } from '@/server/sample-dmp-diff';

export const metadata: Metadata = {
  title: 'DMP差分チェック | RDMate JP',
};

export default function DmpDiffPage() {
  const report = getSampleDmpDiffReport();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>DMPとの差分チェック</h1>
        <p>
          DMPで宣言した方針と、研究期間中に登録されたDataset台帳の実態を比較し、DMP更新候補とDataset修正候補を分けて表示します。
        </p>
      </section>

      <DmpDiffDashboard report={report} />
    </AppShell>
  );
}
