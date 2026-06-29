import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { datasetCsvColumns, generateDatasetCsv } from '@/domain/dataset';
import { getSampleDatasets } from '@/server/sample-datasets';

export const metadata: Metadata = {
  title: 'データセットCSVインポート | RDMate JP',
};

export default function DatasetImportPage() {
  const sampleCsv = generateDatasetCsv(getSampleDatasets()).split('\n').slice(0, 3).join('\n');

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Dataset CSV</p>
        <h1>データセットCSVインポート</h1>
        <p>
          データセット台帳CSVを貼り付けると、インポートAPIが必須列、データ種別、公開区分、日付、URL、DOIを検証し、プレビューJSONを返します。
        </p>
      </section>

      <section className="card dataset-import-export">
        <div>
          <p className="eyebrow">Columns</p>
          <h2>CSV列</h2>
          <p>{datasetCsvColumns.join(', ')}</p>
        </div>
        <form className="dataset-import-form" action="/api/datasets/import" method="post">
          <label>
            CSV本文
            <textarea name="csv" defaultValue={sampleCsv} />
          </label>
          <button className="secondary-button" type="submit">
            インポートプレビューを生成
          </button>
        </form>
      </section>
    </AppShell>
  );
}
