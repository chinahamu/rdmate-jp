import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DatasetAddForm } from '@/components/dataset-add-form';
import { datasetTypeValues, publicationStatusValues } from '@/domain/dataset';
import { getSampleResearchProject } from '@/server/sample-project';

export const metadata: Metadata = {
  title: 'データセット追加 | RDMate JP',
};

export default function NewDatasetPage() {
  const project = getSampleResearchProject();
  const dataManager = project.members.find((member) => member.id === project.dataManagerMemberId) ?? project.members[0];

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Dataset Ledger</p>
        <h1>データセット追加</h1>
        <p>
          DMP作成済みプロジェクト「{project.title}」に新しいDatasetを追加するための入力項目です。送信前にCSVプレビューAPIで検証します。
        </p>
      </section>

      <section className="card dataset-import-export" aria-label="データセット追加フォーム">
        <div>
          <p className="eyebrow">New Dataset</p>
          <h2>Dataset基本情報</h2>
          <p>
            必須項目を入力し、保存場所や公開区分を確認してから台帳に追加します。検証はCSVインポートプレビューと同じスキーマを使います。
          </p>
        </div>
        <DatasetAddForm
          project={project}
          dataManager={dataManager}
          datasetTypeValues={datasetTypeValues}
          publicationStatusValues={publicationStatusValues}
        />
      </section>
    </AppShell>
  );
}
