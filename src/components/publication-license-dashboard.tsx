import {
  assessPublicationDecision,
  getLicenseCatalogItem,
  getPublicationReadiness,
  publicationLicenseCatalog,
  publicationStatusOptions,
  summarizePublicationDecisions,
  type PublicationDecision,
  type PublicationDecisionIssue,
} from '@/domain/publication-license';
import { getPublicationStatusLabel, type Dataset } from '@/domain/dataset';

type PublicationLicenseDashboardProps = Readonly<{
  datasets: Dataset[];
  decisions: PublicationDecision[];
}>;

export function PublicationLicenseDashboard({ datasets, decisions }: PublicationLicenseDashboardProps) {
  const summary = summarizePublicationDecisions(decisions);

  return (
    <>
      <section className="card publication-summary" aria-label="公開区分ライセンス管理サマリー">
        <div>
          <p className="eyebrow">Publication & License</p>
          <h2>公開区分・ライセンス判断</h2>
          <p>Datasetごとに公開区分、公開予定日、利用条件、ライセンス、非公開理由、契約・知財観点の確認状況を管理します。</p>
        </div>
        <dl className="dataset-ledger-stats">
          <div><dt>Dataset</dt><dd>{summary.total}</dd></div>
          <div><dt>要レビュー</dt><dd>{summary.needsReview}</dd></div>
          <div><dt>ブロック</dt><dd>{summary.blocked}</dd></div>
        </dl>
      </section>

      <section className="card publication-status-list" aria-label="公開区分候補">
        <div>
          <p className="eyebrow">Publication Status</p>
          <h2>公開区分</h2>
          <p>open / embargoed / restricted / closed / undecided の5区分を表示し、判断理由や不足項目を確認します。</p>
        </div>
        <ul>
          {publicationStatusOptions.map((option) => (
            <li key={option.value}>
              <strong>{option.label}</strong>
              <span>{option.description}</span>
              <em>{summary.countsByStatus[option.value]}件</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="publication-card-grid" aria-label="データセット別公開判断">
        {datasets.map((dataset) => {
          const decision = decisions.find((candidate) => candidate.datasetId === dataset.id);
          if (!decision) return null;

          const issues = assessPublicationDecision(decision);
          const readiness = getPublicationReadiness(issues);
          const licenseItem = getLicenseCatalogItem(decision.license);

          return (
            <article key={dataset.id} className="card publication-card" data-readiness={readiness}>
              <div className="template-card__header">
                <div>
                  <p className="eyebrow">{dataset.dataType}</p>
                  <h2>{dataset.name}</h2>
                </div>
                <strong className="publication-readiness">{getReadinessLabel(readiness)}</strong>
              </div>

              <dl className="metadata-detail-list">
                <div><dt>公開区分</dt><dd>{getPublicationStatusLabel(decision.publicationStatus)}</dd></div>
                <div><dt>公開予定日</dt><dd>{decision.plannedPublicationDate ?? '未設定'}</dd></div>
                <div><dt>ライセンス</dt><dd>{decision.license ?? '未設定'}</dd></div>
                <div><dt>利用条件</dt><dd>{decision.usageTerms ?? '未設定'}</dd></div>
              </dl>

              <ul className="publication-flags" aria-label="判断フラグ">
                <li data-enabled={decision.containsPersonalInformation}>PII可能性</li>
                <li data-enabled={decision.hasCollaborativeAgreement}>共同研究契約</li>
                <li data-enabled={decision.hasPatentPlan}>特許出願予定</li>
              </ul>

              {decision.nonPublicationReason ? <p className="publication-note">非公開理由: {decision.nonPublicationReason}</p> : null}
              {decision.collaborativeAgreementNote ? <p className="publication-note">契約メモ: {decision.collaborativeAgreementNote}</p> : null}
              {decision.patentPublicationNote ? <p className="publication-note">知財メモ: {decision.patentPublicationNote}</p> : null}

              {licenseItem ? (
                <div className="publication-license-note">
                  <h3>{licenseItem.label}</h3>
                  <p>{licenseItem.recommendedFor}</p>
                  <span>{licenseItem.notes}</span>
                </div>
              ) : null}

              {issues.length > 0 ? <PublicationIssueList issues={issues} /> : <p className="metadata-ok">公開判断チェックを通過しました。</p>}
            </article>
          );
        })}
      </section>

      <section className="card publication-license-catalog" aria-label="ライセンス候補">
        <div>
          <p className="eyebrow">License Catalog</p>
          <h2>ライセンス候補</h2>
          <p>データセットやソースコードに設定できる標準ライセンス候補を一覧化します。</p>
          <a className="secondary-button" href="/api/publication-license/assessment">公開判断チェックJSONを表示</a>
        </div>
        <table className="manifest-table">
          <thead><tr><th>ライセンス</th><th>推奨対象</th><th>メモ</th></tr></thead>
          <tbody>
            {publicationLicenseCatalog.map((license) => (
              <tr key={license.value}><td>{license.label}</td><td>{license.recommendedFor}</td><td>{license.notes}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function PublicationIssueList({ issues }: Readonly<{ issues: PublicationDecisionIssue[] }>) {
  return (
    <ul className="dataset-issue-list">
      {issues.map((issue) => (
        <li key={`${issue.field}-${issue.message}`} data-severity={issue.severity}>{issue.message}</li>
      ))}
    </ul>
  );
}

function getReadinessLabel(readiness: 'ready' | 'needs_review' | 'blocked') {
  if (readiness === 'ready') return '公開判断OK';
  if (readiness === 'blocked') return '要修正';
  return '要レビュー';
}
