import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ImportExportDashboard } from '@/components/import-export-dashboard';
import {
  getSampleCompleteJsonExport,
  getSampleDatasetImportCsv,
  getSampleDatasetImportPreview,
  getSampleRepositoryCsvExport,
} from '@/server/sample-import-export';

export const metadata: Metadata = {
  title: 'インポート/エクスポート | RDMate JP',
};

export default function ImportExportPage() {
  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>インポート/エクスポート</h1>
        <p>
          CSVインポートの取り込み前プレビュー、バックアップ/移行用の完全JSON、リポジトリ登録用CSVを生成します。
        </p>
      </section>

      <ImportExportDashboard
        importCsv={getSampleDatasetImportCsv()}
        importPreview={getSampleDatasetImportPreview()}
        completeJson={getSampleCompleteJsonExport()}
        repositoryCsvExport={getSampleRepositoryCsvExport()}
      />
    </AppShell>
  );
}
