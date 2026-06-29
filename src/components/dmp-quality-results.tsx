import type { DmpQualityReport, DmpQualityIssue } from '@/domain/dmp-quality';
import { getExportDecisionMessage } from '@/domain/dmp-quality';

type DmpQualityResultsProps = Readonly<{
  report: DmpQualityReport;
}>;

export function DmpQualityResults({ report }: DmpQualityResultsProps) {
  const grouped = groupIssues(report.issues);

  return (
    <div className="quality-results">
      <section className="card quality-summary" aria-label="DMPチェックサマリ">
        <div>
          <p className="eyebrow">Quality Summary</p>
          <h2>チェック結果</h2>
          <p>{getExportDecisionMessage(report.summary, false)}</p>
        </div>
        <dl className="quality-counts">
          <div>
            <dt>エラー</dt>
            <dd>{report.summary.errorCount}</dd>
          </div>
          <div>
            <dt>警告</dt>
            <dd>{report.summary.warningCount}</dd>
          </div>
          <div>
            <dt>情報</dt>
            <dd>{report.summary.infoCount}</dd>
          </div>
        </dl>
      </section>

      <section className="card export-gate" aria-label="エクスポート条件">
        <h2>エクスポート時の扱い</h2>
        <label className="checkbox-field">
          <input type="checkbox" name="includeWarnings" defaultChecked={report.summary.canExportWithWarnings} />
          未解決警告を含めてエクスポートする
        </label>
        <p>{getExportDecisionMessage(report.summary, true)}</p>
      </section>

      {(['error', 'warning', 'info'] as const).map((severity) => (
        <section key={severity} className="quality-section" aria-label={`${severity} results`}>
          <h2>{severityLabel[severity]}</h2>
          {grouped[severity].length === 0 ? (
            <p className="quality-empty">該当する項目はありません。</p>
          ) : (
            <ul className="quality-list">
              {grouped[severity].map((issue) => (
                <li key={`${issue.id}-${issue.fieldId ?? 'global'}`} className="quality-item" data-severity={issue.severity}>
                  <div>
                    <p className="eyebrow">{categoryLabel[issue.category]}</p>
                    <h3>{issue.title}</h3>
                    <p>{issue.message}</p>
                    <p className="quality-remediation">対応: {issue.remediation}</p>
                  </div>
                  {issue.fieldId ? (
                    <a className="secondary-button" href={`/dmp/editor#${issue.fieldId}`}>
                      該当設問へ移動
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

const severityLabel = {
  error: 'エラー',
  warning: '警告',
  info: '情報',
} as const;

const categoryLabel = {
  basic: '基本チェック',
  risk: 'リスクチェック',
  export: 'エクスポート',
} as const;

function groupIssues(issues: DmpQualityIssue[]) {
  return {
    error: issues.filter((issue) => issue.severity === 'error'),
    warning: issues.filter((issue) => issue.severity === 'warning'),
    info: issues.filter((issue) => issue.severity === 'info'),
  };
}
