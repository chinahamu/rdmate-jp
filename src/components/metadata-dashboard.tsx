import {
  calculateMetadataCompletion,
  getKeywordCandidates,
  metadataFieldRequirementLabels,
  toDataCiteMetadata,
  toDublinCoreMetadata,
  validateRepositoryMetadata,
  type DatasetMetadata,
} from '@/domain/metadata';
import type { Dataset } from '@/domain/dataset';
import type { ResearchProject } from '@/domain/research-project';

type MetadataDashboardProps = Readonly<{
  project: ResearchProject;
  datasets: Dataset[];
  metadataList: DatasetMetadata[];
}>;

export function MetadataDashboard({ project, datasets, metadataList }: MetadataDashboardProps) {
  const keywordCandidates = getKeywordCandidates(project, datasets, metadataList).slice(0, 12);
  const firstDataset = datasets[0];
  const firstMetadata = firstDataset
    ? metadataList.find((metadata) => metadata.datasetId === firstDataset.id)
    : undefined;
  const firstDataCite = firstDataset && firstMetadata ? toDataCiteMetadata(firstMetadata, firstDataset) : undefined;
  const firstDublinCore = firstDataset && firstMetadata ? toDublinCoreMetadata(firstMetadata, firstDataset) : undefined;

  return (
    <>
      <section className="card metadata-summary" aria-label="メタデータ管理サマリー">
        <div>
          <p className="eyebrow">Metadata</p>
          <h2>基本メタデータとリポジトリ登録チェック</h2>
          <p>
            Datasetごとに、タイトル、説明、作成者、所属、キーワード、研究分野、取得方法、時間・空間範囲、変数説明、関連論文、関連ソフトウェアを管理します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div>
            <dt>Dataset</dt>
            <dd>{datasets.length}</dd>
          </div>
          <div>
            <dt>メタデータ</dt>
            <dd>{metadataList.length}</dd>
          </div>
          <div>
            <dt>候補語</dt>
            <dd>{keywordCandidates.length}</dd>
          </div>
        </dl>
      </section>

      <section className="card metadata-keywords" aria-label="キーワード候補">
        <div>
          <p className="eyebrow">Keyword Candidates</p>
          <h2>再利用できるキーワード候補</h2>
          <p>研究課題、データ種別、既存メタデータから候補を生成します。</p>
        </div>
        <ul>
          {keywordCandidates.map((keyword) => (
            <li key={keyword}>{keyword}</li>
          ))}
        </ul>
      </section>

      <section className="metadata-card-grid" aria-label="データセットメタデータ一覧">
        {datasets.map((dataset) => {
          const metadata = metadataList.find((candidate) => candidate.datasetId === dataset.id);
          if (!metadata) return null;

          const completion = calculateMetadataCompletion(metadata);
          const issues = validateRepositoryMetadata(metadata);
          const dublinCore = toDublinCoreMetadata(metadata, dataset);

          return (
            <article key={dataset.id} className="card metadata-card">
              <div className="template-card__header">
                <div>
                  <p className="eyebrow">{dataset.dataType}</p>
                  <h2>{metadata.title}</h2>
                </div>
                <strong className="metadata-score">{completion.score}%</strong>
              </div>

              <p>{metadata.description}</p>

              <dl className="metadata-detail-list">
                <div>
                  <dt>作成者</dt>
                  <dd>{metadata.creators.map((creator) => `${creator.name}（${creator.affiliation}）`).join('、')}</dd>
                </div>
                <div>
                  <dt>研究分野</dt>
                  <dd>{metadata.researchField}</dd>
                </div>
                <div>
                  <dt>取得方法</dt>
                  <dd>{metadata.acquisitionMethod}</dd>
                </div>
                <div>
                  <dt>時間範囲</dt>
                  <dd>
                    {metadata.temporalCoverage
                      ? `${metadata.temporalCoverage.startDate} - ${metadata.temporalCoverage.endDate}`
                      : '未設定'}
                  </dd>
                </div>
              </dl>

              <h3>必須/推奨/任意</h3>
              <ul className="metadata-completion-list">
                {completion.items.map((item) => (
                  <li key={item.field} data-completed={item.completed} data-requirement={item.requirement}>
                    <span>{metadataFieldRequirementLabels[item.requirement]}</span>
                    {item.label}
                  </li>
                ))}
              </ul>

              <h3>変数・カラム説明</h3>
              {metadata.variables.length > 0 ? (
                <table className="manifest-table">
                  <thead>
                    <tr>
                      <th>変数</th>
                      <th>型</th>
                      <th>説明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.variables.map((variable) => (
                      <tr key={variable.id}>
                        <td>{variable.name}</td>
                        <td>{variable.dataType}</td>
                        <td>{variable.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="dataset-muted">変数・カラム説明は未設定です。</p>
              )}

              <h3>Dublin Coreプレビュー</h3>
              <pre>{JSON.stringify(dublinCore, null, 2)}</pre>

              {issues.length > 0 ? (
                <ul className="dataset-issue-list">
                  {issues.map((issue) => (
                    <li key={issue.field} data-severity="warning">
                      {issue.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="metadata-ok">リポジトリ登録用の主要項目は入力済みです。</p>
              )}
            </article>
          );
        })}
      </section>

      <section className="card dataset-import-export" aria-label="メタデータスキーマと出力">
        <div>
          <p className="eyebrow">Schema / Export</p>
          <h2>RDMate共通スキーマ・DataCite変換</h2>
          <p>
            RDMate独自の共通スキーマを公開し、リポジトリ登録向けにDublin Core / DataCite風の構造へマッピングできます。
          </p>
          <div className="dataset-ledger-actions">
            <a className="secondary-button" href="/api/metadata/schema">
              JSON Schemaを表示
            </a>
            <a className="secondary-button" href="/api/metadata/export/datacite">
              DataCite JSONを保存
            </a>
            <a className="secondary-button" href="/api/metadata/export/dublin-core">
              Dublin Core JSONを保存
            </a>
          </div>
        </div>
        <textarea
          readOnly
          aria-label="DataCiteプレビュー"
          value={firstDataCite ? JSON.stringify(firstDataCite, null, 2) : '{}'}
        />
        <textarea
          readOnly
          aria-label="Dublin Coreプレビュー"
          value={firstDublinCore ? JSON.stringify(firstDublinCore, null, 2) : '{}'}
        />
      </section>
    </>
  );
}
