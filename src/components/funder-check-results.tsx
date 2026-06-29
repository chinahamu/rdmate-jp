import type { FunderCheckReport, FunderCheckRuleResult } from '@/domain/funder-check-rule';

type FunderCheckResultsProps = Readonly<{
  report: FunderCheckReport;
}>;

export function FunderCheckResults({ report }: FunderCheckResultsProps) {
  const failedResults = report.results.filter((result) => result.status === 'failed');
  const passedResults = report.results.filter((result) => result.status === 'passed');
  const skippedResults = report.results.filter((result) => result.status === 'skipped');

  return (
    <div className="quality-results">
      <section className="card quality-summary" aria-label="助成機関別チェックサマリ">
        <div>
          <p className="eyebrow">Funder Check Summary</p>
          <h2>適合スコア {report.summary.score}/100</h2>
          <p>{statusLabels[report.summary.status]}</p>
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
          <div>
            <dt>スキップ</dt>
            <dd>{report.summary.skippedCount}</dd>
          </div>
        </dl>
      </section>

      <section className="card export-gate" aria-label="レポート出力">
        <h2>レビュー用レポート出力</h2>
        <p>助成機関別チェック結果を Markdown または PDF で出力できます。</p>
        <div className="button-row">
          <a className="secondary-button" href="/api/validators/funder-check/report/markdown">
            Markdownレポート
          </a>
          <a className="secondary-button" href="/api/validators/funder-check/report/pdf">
            PDFレポート
          </a>
        </div>
      </section>

      <ResultSection title="要対応" results={failedResults} emptyText="要対応のルールはありません。" />
      <ResultSection title="適合" results={passedResults} emptyText="適合済みのルールはありません。" />
      <ResultSection title="条件外" results={skippedResults} emptyText="条件外のルールはありません。" />

      <section className="card" aria-label="URA・図書館担当者向けコメント欄">
        <p className="eyebrow">Reviewer Comments</p>
        <h2>URA・図書館担当者向けコメント欄</h2>
        {report.reviewCommentPrompts.length === 0 ? (
          <p>コメントプロンプトはありません。</p>
        ) : (
          <ul className="quality-list">
            {report.reviewCommentPrompts.map((prompt) => (
              <li key={`${prompt.role}-${prompt.prompt}`} className="quality-item" data-severity="info">
                <div>
                  <p className="eyebrow">{prompt.role === 'ura' ? 'URA' : 'Library'}</p>
                  <h3>{prompt.label}</h3>
                  <p>{prompt.prompt}</p>
                  <textarea aria-label={`${prompt.label} コメント`} placeholder="担当者コメントをここに記入" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ResultSection({
  title,
  results,
  emptyText,
}: Readonly<{
  title: string;
  results: FunderCheckRuleResult[];
  emptyText: string;
}>) {
  return (
    <section className="quality-section" aria-label={`${title} ルール`}>
      <h2>{title}</h2>
      {results.length === 0 ? (
        <p className="quality-empty">{emptyText}</p>
      ) : (
        <ul className="quality-list">
          {results.map((result) => (
            <li key={result.ruleId} className="quality-item" data-severity={result.severity}>
              <div>
                <p className="eyebrow">
                  {result.ruleType} / {result.status} / {result.weight}点
                </p>
                <h3>{result.message}</h3>
                <p className="quality-remediation">対応: {result.remediation}</p>
                {result.violations.length > 0 ? (
                  <ul>
                    {result.violations.map((violation) => (
                      <li key={`${result.ruleId}-${violation.fieldId ?? violation.fieldIds?.join('-') ?? violation.message}`}>
                        {violation.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const statusLabels = {
  compliant: '助成機関別チェックに適合しています。',
  needs_review: '警告があります。URA・図書館担当者による確認を推奨します。',
  non_compliant: '必須項目に未対応があります。エクスポート前に修正してください。',
} as const;
