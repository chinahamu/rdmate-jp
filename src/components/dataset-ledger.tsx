import Link from 'next/link';
import {
  datasetLicenseValues,
  datasetStatusLabels,
  datasetStatusValues,
  datasetTypeLabels,
  datasetTypeValues,
  filterDatasets,
  generateDatasetCsv,
  getDatasetAttentionState,
  getDatasetStatusLabel,
  getDatasetTypeLabel,
  getPublicationStatusLabel,
  getStorageLocationTypeLabel,
  publicationStatusLabels,
  publicationStatusValues,
  validateDatasetLedger,
  type Dataset,
  type DatasetAttentionState,
  type DatasetFilterCriteria,
  type DatasetLedgerIssue,
} from '@/domain/dataset';
import type { ResearchProject } from '@/domain/research-project';

const attentionLabels: Record<DatasetAttentionState, string> = {
  ready: '確認済み',
  unchecked: '未チェック',
  needs_action: '要対応',
};

type DatasetLedgerProps = Readonly<{
  project: ResearchProject;
  datasets: Dataset[];
  filters: DatasetFilterCriteria;
}>;

export function DatasetLedger({ project, datasets, filters }: DatasetLedgerProps) {
  const filteredDatasets = filterDatasets(datasets, filters);
  const issues = validateDatasetLedger(filteredDatasets);
  const issuesByDatasetId = groupIssuesByDatasetId(issues);
  const csvPreview = generateDatasetCsv(filteredDatasets).split('\n').slice(0, 4).join('\n');
  const needsActionCount = filteredDatasets.filter(
    (dataset) => getDatasetAttentionState(dataset, issuesByDatasetId.get(dataset.id) ?? []) !== 'ready',
  ).length;

  return (
    <>
      <section className="card dataset-ledger-summary" aria-label="データセット台帳サマリー">
        <div>
          <p className="eyebrow">Project</p>
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
        </div>
        <dl className="dataset-ledger-stats">
          <div>
            <dt>表示中</dt>
            <dd>{filteredDatasets.length}</dd>
          </div>
          <div>
            <dt>要確認</dt>
            <dd>{needsActionCount}</dd>
          </div>
          <div>
            <dt>公開可能</dt>
            <dd>{filteredDatasets.filter((dataset) => dataset.publicationStatus === 'open').length}</dd>
          </div>
        </dl>
      </section>

      <form className="card dataset-ledger-filters" method="get" aria-label="データセットフィルタ">
        <label>
          データ種別
          <select name="dataType" defaultValue={filters.dataType ?? ''}>
            <option value="">すべて</option>
            {datasetTypeValues.map((dataType) => (
              <option key={dataType} value={dataType}>
                {datasetTypeLabels[dataType]}
              </option>
            ))}
          </select>
        </label>
        <label>
          ステータス
          <select name="status" defaultValue={filters.status ?? ''}>
            <option value="">すべて</option>
            {datasetStatusValues.map((status) => (
              <option key={status} value={status}>
                {datasetStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          公開区分
          <select name="publicationStatus" defaultValue={filters.publicationStatus ?? ''}>
            <option value="">すべて</option>
            {publicationStatusValues.map((status) => (
              <option key={status} value={status}>
                {publicationStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          責任者
          <select name="responsibleMemberId" defaultValue={filters.responsibleMemberId ?? ''}>
            <option value="">すべて</option>
            {project.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          ライセンス
          <select name="license" defaultValue={filters.license ?? ''}>
            <option value="">すべて</option>
            {datasetLicenseValues.map((license) => (
              <option key={license} value={license}>
                {license}
              </option>
            ))}
          </select>
        </label>
        <div className="dataset-ledger-actions">
          <button className="secondary-button" type="submit">
            フィルタ
          </button>
          <Link className="secondary-button" href="/datasets">
            リセット
          </Link>
          <Link className="secondary-button" href="/datasets/new">
            Dataset追加
          </Link>
          <a className="secondary-button" href="/api/datasets/export">
            CSVエクスポート
          </a>
          <a className="secondary-button" href="/api/datasets/export/json">
            JSONエクスポート
          </a>
          <Link className="secondary-button" href="/datasets/import">
            CSVインポート
          </Link>
        </div>
      </form>

      <section className="dataset-ledger-table-wrapper" aria-label="データセット一覧">
        <table className="dataset-ledger-table">
          <thead>
            <tr>
              <th>確認</th>
              <th>データセット</th>
              <th>種別</th>
              <th>責任者</th>
              <th>保存場所</th>
              <th>公開区分</th>
              <th>ライセンス</th>
            </tr>
          </thead>
          <tbody>
            {filteredDatasets.map((dataset) => {
              const datasetIssues = issuesByDatasetId.get(dataset.id) ?? [];
              const attentionState = getDatasetAttentionState(dataset, datasetIssues);
              const responsibleMember = project.members.find(
                (member) => member.id === dataset.responsibleMemberId,
              );

              return (
                <tr key={dataset.id} data-attention-state={attentionState}>
                  <td>
                    <span className={`dataset-attention dataset-attention--${attentionState}`}>
                      {attentionLabels[attentionState]}
                    </span>
                  </td>
                  <td>
                    <strong>{dataset.name}</strong>
                    <span>{dataset.description}</span>
                    <code>{dataset.id}</code>
                    {datasetIssues.length > 0 ? <IssueList issues={datasetIssues} /> : null}
                  </td>
                  <td>
                    {getDatasetTypeLabel(dataset.dataType)}
                    <span>{getDatasetStatusLabel(dataset.status)}</span>
                  </td>
                  <td>{responsibleMember?.name ?? dataset.responsibleMemberId}</td>
                  <td>
                    {dataset.storageLocations.length > 0 ? (
                      <ul className="dataset-storage-list">
                        {dataset.storageLocations.map((location) => (
                          <li key={location.id}>
                            <strong>{location.label ?? getStorageLocationTypeLabel(location.storageType)}</strong>
                            <span>{location.uri}</span>
                            <small>
                              {location.hasBackup ? 'バックアップあり' : 'バックアップ未設定'} /{' '}
                              {location.isEncrypted ? '暗号化あり' : '暗号化未設定'}
                            </small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="dataset-muted">未設定</span>
                    )}
                  </td>
                  <td>
                    {getPublicationStatusLabel(dataset.publicationStatus)}
                    {dataset.plannedPublicationDate ? <span>{dataset.plannedPublicationDate}</span> : null}
                    {dataset.publicUrl ? <a href={dataset.publicUrl}>{dataset.publicUrl}</a> : null}
                    {dataset.doi ? <code>{dataset.doi}</code> : null}
                  </td>
                  <td>{dataset.license ?? '未設定'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card dataset-import-export" aria-label="CSVインポート・エクスポート">
        <div>
          <p className="eyebrow">CSV / JSON</p>
          <h2>CSVインポート/エクスポート</h2>
          <p>
            一覧と同じデータセット台帳スキーマでCSV/JSONを出力できます。CSVインポートAPIは検証結果とプレビューJSONを返します。
          </p>
        </div>
        <textarea readOnly value={csvPreview} aria-label="CSVプレビュー" />
      </section>
    </>
  );
}

function IssueList({ issues }: Readonly<{ issues: DatasetLedgerIssue[] }>) {
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

function groupIssuesByDatasetId(issues: DatasetLedgerIssue[]): Map<string, DatasetLedgerIssue[]> {
  const issueMap = new Map<string, DatasetLedgerIssue[]>();

  for (const issue of issues) {
    const currentIssues = issueMap.get(issue.datasetId) ?? [];
    issueMap.set(issue.datasetId, [...currentIssues, issue]);
  }

  return issueMap;
}
