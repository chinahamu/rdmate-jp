import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { StorageReferenceDashboard } from '@/components/storage-reference-dashboard';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSampleManifestEntries } from '@/server/sample-storage-reference';

export const metadata: Metadata = {
  title: '保存場所・参照管理 | RDMate JP',
};

export default function StorageReferencePage() {
  const datasets = getSampleDatasets();
  const manifestEntries = getSampleManifestEntries();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>保存場所・参照管理</h1>
        <p>
          データセットの実ファイルをアプリに取り込まず、所在情報、アクセス範囲、バックアップ、暗号化、ファイルマニフェストのメタデータを管理します。
        </p>
      </section>

      <StorageReferenceDashboard datasets={datasets} manifestEntries={manifestEntries} />
    </AppShell>
  );
}
