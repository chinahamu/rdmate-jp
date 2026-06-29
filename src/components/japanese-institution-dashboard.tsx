import {
  createJapaneseInstitutionDmpHints,
  formatAffiliationHierarchy,
  formatBilingualName,
  getKakenhiInputHints,
  normalizeKakenhiProjectNumber,
  summarizeJapaneseInstitutionSupport,
  toJapaneseInstitutionProfile,
} from '@/domain/japanese-institution';
import type { ResearchProject } from '@/domain/research-project';
import { getFundingAgencyTypeLabel } from '@/domain/funding';

export type JapaneseInstitutionDashboardProps = Readonly<{
  project: ResearchProject;
}>;

export function JapaneseInstitutionDashboard({ project }: JapaneseInstitutionDashboardProps) {
  const profiles = project.members.map(toJapaneseInstitutionProfile);
  const summary = summarizeJapaneseInstitutionSupport(project);
  const hints = createJapaneseInstitutionDmpHints(project);

  return (
    <>
      <section className="card access-control-summary" aria-label="日本の研究機関向け配慮サマリー">
        <div>
          <p className="eyebrow">Japanese Institution Support</p>
          <h2>日本の研究機関向け配慮</h2>
          <p>
            日本語氏名・英語氏名の併記、所属部局・研究科・専攻などの階層管理、科研費課題番号の入力補助、
            日本語DMP出力の既定化をまとめて確認します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div><dt>メンバー</dt><dd>{summary.memberCount}</dd></div>
          <div><dt>氏名併記</dt><dd>{summary.bilingualNameCount}</dd></div>
          <div><dt>所属階層</dt><dd>{summary.hierarchicalAffiliationCount}</dd></div>
          <div><dt>DMP既定言語</dt><dd>{summary.defaultDmpExportLanguage === 'ja' ? '日本語' : summary.defaultDmpExportLanguage}</dd></div>
        </dl>
      </section>

      <section className="card access-control-role-matrix" aria-label="日本語氏名と所属階層">
        <div>
          <p className="eyebrow">Members</p>
          <h2>日本語氏名・英語氏名・所属階層</h2>
          <p>研究代表者、Data Steward、共同研究者を日本の研究機関で扱いやすい表記で管理します。</p>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr>
                <th>氏名</th>
                <th>ロール</th>
                <th>所属階層</th>
                <th>メール</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.memberId}>
                  <th>{formatBilingualName(profile.name)}</th>
                  <td>{profile.role}</td>
                  <td>{formatAffiliationHierarchy(profile.affiliation)}</td>
                  <td>{profile.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card access-control-role-matrix" aria-label="科研費入力補助">
        <div>
          <p className="eyebrow">KAKENHI</p>
          <h2>科研費課題番号等の入力補助</h2>
          <p>助成種別に応じて、科研費課題番号の形式確認と正規化候補を表示します。</p>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr>
                <th>助成機関</th>
                <th>制度</th>
                <th>種別</th>
                <th>課題番号</th>
                <th>入力補助</th>
              </tr>
            </thead>
            <tbody>
              {project.funding.map((funding) => (
                <tr key={funding.id}>
                  <th>{funding.agencyName}</th>
                  <td>{funding.programName}</td>
                  <td>{getFundingAgencyTypeLabel(funding.agencyType)}</td>
                  <td>{funding.projectNumber ? normalizeKakenhiProjectNumber(funding.projectNumber) : '未設定'}</td>
                  <td>{getKakenhiInputHints(funding.projectNumber).join(' / ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-label="日本語DMP出力設定">
        <p className="eyebrow">DMP Export</p>
        <h2>日本語DMP出力を標準にする</h2>
        <p>
          この研究課題のDMP出力既定言語は <strong>{project.preferredDmpLanguage === 'ja' ? '日本語' : '英語'}</strong> です。
          Markdown/JSON出力では日本語項目名、氏名併記、所属階層、科研費課題番号を含めます。
        </p>
        <ul className="dataset-issue-list">
          {hints.map((hint) => (
            <li key={hint} data-severity="info">{hint}</li>
          ))}
        </ul>
        <a className="secondary-button" href="/api/japanese-institution/summary">日本の研究機関向けサマリーJSONを表示</a>
      </section>

      <section className="card" aria-label="日本の研究機関向け設定チェック">
        <p className="eyebrow">Validation</p>
        <h2>設定チェック</h2>
        {summary.issues.length > 0 ? (
          <ul className="dataset-issue-list">
            {summary.issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`} data-severity={issue.severity}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p className="metadata-ok">日本語氏名・英語氏名、所属階層、科研費課題番号、日本語DMP出力の設定に不足はありません。</p>
        )}
      </section>
    </>
  );
}
