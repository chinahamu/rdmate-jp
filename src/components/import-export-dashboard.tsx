import type { DatasetCsvImportPreview, CompleteJsonExport, RepositoryCsvExport } from '@/domain/import-export';

type ImportExportDashboardProps = Readonly<{
  importCsv: string;
  importPreview: DatasetCsvImportPreview;
  completeJson: CompleteJsonExport;
  repositoryCsvExport: RepositoryCsvExport;
}>;

export function ImportExportDashboard({
  importCsv,
  importPreview,
  completeJson,
  repositoryCsvExport,
}: ImportExportDashboardProps) {
  return (
    <>
      <section className="card import-export-summary" aria-label="インポートエクスポートサマリー">
        <div>
          <p className="eyebrow">Import / Export</p>
          <h2>CSVプレビュー・完全JSON・リポジトリCSV</h2>
          <p>
            データセット台帳CSVの取り込み前検証、RDMate完全バックアップJSON、JAIRO Cloud/DataCite相当CSVの出力をまとめて確認します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div>
            <dt>CSV行</dt>
            <dd>{importPreview.totalRows}</dd>
          </div>
          <div>
            <dt>有効</dt>
            <dd>{importPreview.validRows}</dd>
          </div>
          <div>
            <dt>課題</dt>
            <dd>{importPreview.issues.length}</dd>
          </div>
        </dl>
      </section>

      <section className="card import-preview-grid" aria-label="CSVインポートプレビュー">
        <div>
          <p className="eyebrow">CSV Import Preview</p>
          <h2>取り込み前プレビュー</h2>
          <p>必須列、値の妥当性、CSV内重複、既存Datasetとの重複を検出します。</p>
          <div className="dataset-ledger-actions">
            <a className="secondary-button" href="/api/import-export/template/dataset-csv">
              CSVテンプレートを保存
            </a>
          </div>
          {importPreview.issues.length > 0 ? (
            <ul className="dataset-issue-list">
              {importPreview.issues.map((issue) => (
                <li key={`${issue.rowNumber}-${issue.field}-${issue.message}`} data-severity={issue.severity}>
                  {issue.rowNumber}行目: {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="metadata-ok">CSVプレビューで課題は検出されませんでした。</p>
          )}
        </div>
        <textarea readOnly aria-label="CSVインポートサンプル" value={importCsv} />
      </section>

      <section className="card import-export-grid" aria-label="完全JSONエクスポート">
        <div>
          <p className="eyebrow">Complete JSON</p>
          <h2>バックアップ/移行用完全JSON</h2>
          <p>研究課題、DMP、Dataset、メタデータ、ファイルマニフェスト、関連成果物を1つのJSONにまとめます。</p>
          <a className="secondary-button" href="/api/import-export/export/complete-json">
            完全JSONを保存
          </a>
        </div>
        <textarea readOnly aria-label="完全JSONプレビュー" value={JSON.stringify(completeJson, null, 2)} />
      </section>

      <section className="card import-export-grid" aria-label="リポジトリ登録CSV">
        <div>
          <p className="eyebrow">Repository CSV</p>
          <h2>JAIRO Cloud / DataCite相当CSV</h2>
          <p>タイトル、作成者、説明、キーワード、出版年、識別子、権利、関連識別子、フィールド不足をCSVに出力します。</p>
          <a className="secondary-button" href="/api/import-export/export/repository-csv">
            リポジトリCSVを保存
          </a>
          {repositoryCsvExport.issues.length > 0 ? (
            <ul className="dataset-issue-list">
              {repositoryCsvExport.issues.map((issue) => (
                <li key={`${issue.datasetId}-${issue.field}-${issue.message}`} data-severity={issue.severity}>
                  {issue.datasetId}: {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="metadata-ok">リポジトリ登録用CSVの必須項目は充足しています。</p>
          )}
        </div>
        <textarea readOnly aria-label="リポジトリCSVプレビュー" value={repositoryCsvExport.csv} />
      </section>
    </>
  );
}
