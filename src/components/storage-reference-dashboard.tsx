import {
  generateManifestCsv,
  generateManifestJson,
  getManifestFileName,
  validateFileManifest,
  validateStorageReferences,
  type FileManifestEntry,
  type StorageReferenceIssue,
} from '@/domain/storage-reference';
import type { Dataset } from '@/domain/dataset';

type StorageReferenceDashboardProps = Readonly<{
  datasets: Dataset[];
  manifestEntries: FileManifestEntry[];
}>;

export function StorageReferenceDashboard({ datasets, manifestEntries }: StorageReferenceDashboardProps) {
  const storageIssues = validateStorageReferences(datasets);
  const manifestIssues = datasets.flatMap((dataset) =>
    validateFileManifest(
      dataset,
      manifestEntries.filter((entry) => entry.datasetId === dataset.id),
    ),
  );
  const allIssues = [...storageIssues, ...manifestIssues];
  const manifestCsvPreview = generateManifestCsv(manifestEntries).split('\n').slice(0, 6).join('\n');
  const firstDataset = datasets[0];
  const firstManifestJson = firstDataset
    ? generateManifestJson({
        datasetId: firstDataset.id,
        entries: manifestEntries.filter((entry) => entry.datasetId === firstDataset.id),
      })
    : '{}\n';

  return (
    <>
      <section className="card storage-reference-summary" aria-label="保存場所参照管理サマリー">
        <div>
          <p className="eyebrow">Storage References</p>
          <h2>保存場所・参照チェック</h2>
          <p>
            実データは取り込まず、ローカルパス・ネットワークドライブ・クラウドURL・GakuNin RDM URL・GitHub URLなどの所在情報と管理責任だけを記録します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div>
            <dt>保存場所</dt>
            <dd>{datasets.reduce((count, dataset) => count + dataset.storageLocations.length, 0)}</dd>
          </div>
          <div>
            <dt>マニフェスト</dt>
            <dd>{manifestEntries.length}</dd>
          </div>
          <div>
            <dt>警告/情報</dt>
            <dd>{allIssues.length}</dd>
          </div>
        </dl>
      </section>

      <section className="storage-reference-grid" aria-label="保存場所一覧">
        {datasets.map((dataset) => {
          const datasetIssues = allIssues.filter((issue) => issue.datasetId === dataset.id);
          const datasetManifestEntries = manifestEntries.filter((entry) => entry.datasetId === dataset.id);

          return (
            <article key={dataset.id} className="card storage-reference-card">
              <div className="template-card__header">
                <div>
                  <p className="eyebrow">Dataset</p>
                  <h2>{dataset.name}</h2>
                </div>
                <a className="secondary-button" href={`/api/storage/manifest/json?datasetId=${dataset.id}`}>
                  manifest.json
                </a>
              </div>

              <h3>保存場所</h3>
              {dataset.storageLocations.length > 0 ? (
                <ul className="storage-location-list">
                  {dataset.storageLocations.map((location) => (
                    <li key={location.id}>
                      <strong>{location.label ?? location.storageType}</strong>
                      <code>{location.uri}</code>
                      <span>
                        {location.storageType} / {location.accessScope ?? 'アクセス範囲未設定'} /{' '}
                        {location.hasBackup ? 'バックアップあり' : 'バックアップ未設定'} /{' '}
                        {location.isEncrypted ? '暗号化あり' : '暗号化未設定'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dataset-muted">保存場所が未設定です。</p>
              )}

              <h3>ファイルマニフェスト</h3>
              {datasetManifestEntries.length > 0 ? (
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>ファイル名</th>
                      <th>相対パス</th>
                      <th>サイズ</th>
                      <th>ハッシュ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetManifestEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.fileName}</td>
                        <td>{entry.relativePath}</td>
                        <td>{entry.sizeBytes.toLocaleString()} bytes</td>
                        <td>{entry.hashAlgorithm === 'none' ? '未設定' : entry.hashAlgorithm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="dataset-muted">マニフェスト行が未設定です。</p>
              )}

              {datasetIssues.length > 0 ? <StorageIssueList issues={datasetIssues} /> : null}
            </article>
          );
        })}
      </section>

      <section className="card dataset-import-export" aria-label="マニフェスト出力">
        <div>
          <p className="eyebrow">Manifest Export</p>
          <h2>manifest.csv / manifest.json</h2>
          <p>
            大容量ファイル本体は保存せず、ファイル名、相対パス、サイズ、ハッシュ、MIMEタイプ、更新日時のみを出力します。
          </p>
          <div className="dataset-ledger-actions">
            <a className="secondary-button" href="/api/storage/manifest/csv">
              manifest.csvを保存
            </a>
            {firstDataset ? (
              <a className="secondary-button" href={`/api/storage/manifest/json?datasetId=${firstDataset.id}`}>
                {getManifestFileName(firstDataset, 'json')}を保存
              </a>
            ) : null}
          </div>
        </div>
        <div className="manifest-preview-stack">
          <textarea readOnly aria-label="manifest.csvプレビュー" value={manifestCsvPreview} />
          <textarea readOnly aria-label="manifest.jsonプレビュー" value={firstManifestJson} />
        </div>
      </section>
    </>
  );
}

function StorageIssueList({ issues }: Readonly<{ issues: StorageReferenceIssue[] }>) {
  return (
    <ul className="dataset-issue-list">
      {issues.map((issue) => (
        <li key={`${issue.field}-${issue.message}`} data-severity={issue.severity}>
          {issue.message}
        </li>
      ))}
    </ul>
  );
}
