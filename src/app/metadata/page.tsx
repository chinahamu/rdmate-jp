import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { MetadataDashboard } from '@/components/metadata-dashboard';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSampleDatasetMetadata } from '@/server/sample-metadata';
import { getSampleResearchProject } from '@/server/sample-project';

export const metadata: Metadata = {
  title: 'メタデータ管理 | RDMate JP',
};

export default function MetadataPage() {
  const project = getSampleResearchProject();
  const datasets = getSampleDatasets();
  const metadataList = getSampleDatasetMetadata();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>メタデータ管理</h1>
        <p>
          データセットごとの基本メタデータ、RDMate共通スキーマ、Dublin Core / DataCite風マッピング、リポジトリ登録前チェックを管理します。
        </p>
      </section>

      <MetadataDashboard project={project} datasets={datasets} metadataList={metadataList} />
    </AppShell>
  );
}
