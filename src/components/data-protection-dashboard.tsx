import {
  backupTargetLabels,
  dataProtectionPrincipleLabels,
  dataProtectionPrincipleValues,
  sensitiveDataSignalLabels,
  type BackupPlan,
  type DataProtectionIssue,
  type LogicalDeleteRecord,
  type OperationEnv,
  type ProjectJsonSnapshot,
  type SessionConfig,
} from '@/domain/data-protection';

type DataProtectionDashboardProps = Readonly<{
  riskyIssues: DataProtectionIssue[];
  safeIssues: DataProtectionIssue[];
  institutionalIssues: DataProtectionIssue[];
  backupPlans: BackupPlan[];
  sessionConfig: SessionConfig;
  operationEnv: OperationEnv;
  projectSnapshot: ProjectJsonSnapshot;
  importIssues: DataProtectionIssue[];
  logicalDelete: LogicalDeleteRecord;
  serverValidationAllowed: boolean;
}>;

export function DataProtectionDashboard({
  riskyIssues,
  safeIssues,
  institutionalIssues,
  backupPlans,
  sessionConfig,
  operationEnv,
  projectSnapshot,
  importIssues,
  logicalDelete,
  serverValidationAllowed,
}: DataProtectionDashboardProps) {
  const allIssues = [...riskyIssues, ...safeIssues, ...institutionalIssues, ...importIssues];
  const errorCount = allIssues.filter((issue) => issue.severity === 'error').length;
  const warningCount = allIssues.filter((issue) => issue.severity === 'warning').length;

  return (
    <>
      <section className="card data-protection-summary" aria-label="データ保護運用設計サマリー">
        <div>
          <p className="eyebrow">Data Protection & Operations</p>
          <h2>データ保護・運用設計</h2>
          <p>
            RDMate JPは実データ本体を保持せず、メタデータ・DMP・台帳・監査情報を管理します。
            個人情報・要配慮情報の可能性を警告し、サーバ側の検証・権限チェック・バックアップ運用を支援します。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div><dt>検出エラー</dt><dd>{errorCount}</dd></div>
          <div><dt>警告</dt><dd>{warningCount}</dd></div>
          <div><dt>権限判定</dt><dd>{serverValidationAllowed ? '許可' : '不可'}</dd></div>
        </dl>
      </section>

      <section className="data-protection-card-grid" aria-label="基本方針">
        {dataProtectionPrincipleValues.map((principle) => (
          <article key={principle} className="card data-protection-card">
            <p className="eyebrow">{principle}</p>
            <h2>{dataProtectionPrincipleLabels[principle]}</h2>
            <p>{getPrincipleDescription(principle)}</p>
          </article>
        ))}
      </section>

      <section className="card data-protection-table-section" aria-label="サーバ側検証">
        <div>
          <p className="eyebrow">Server-side Validation</p>
          <h2>入力値・公開判断チェック</h2>
          <p>実データ本体の保存、個人情報・要配慮情報、ローカルパス、自由記述中の識別子候補をサーバ側で検出します。</p>
          <a className="secondary-button" href="/api/data-protection/summary">データ保護JSONを表示</a>
        </div>
        <IssueList issues={riskyIssues} emptyMessage="危険サンプルで検出された問題はありません。" />
      </section>

      <section className="data-protection-card-grid" aria-label="セッションと環境設定">
        <article className="card data-protection-card">
          <p className="eyebrow">Session</p>
          <h2>セッション管理</h2>
          <dl className="metadata-detail-list">
            <div><dt>Cookie Secure</dt><dd>{sessionConfig.cookieSecure ? '有効' : '無効'}</dd></div>
            <div><dt>SameSite</dt><dd>{sessionConfig.sameSite}</dd></div>
            <div><dt>有効期限</dt><dd>{sessionConfig.maxAgeMinutes}分</dd></div>
          </dl>
        </article>
        <article className="card data-protection-card">
          <p className="eyebrow">Environment</p>
          <h2>.env 管理</h2>
          <dl className="metadata-detail-list">
            <div><dt>利用モード</dt><dd>{operationEnv.usageMode}</dd></div>
            <div><dt>HTTPS強制</dt><dd>{operationEnv.enforceHttps ? '有効' : '無効'}</dd></div>
            <div><dt>バックアップ先</dt><dd>{operationEnv.backupDirectory}</dd></div>
            <div><dt>実データアップロード</dt><dd>{operationEnv.allowRawDataUpload ? '許可' : '禁止'}</dd></div>
          </dl>
        </article>
        <article className="card data-protection-card">
          <p className="eyebrow">Institutional Check</p>
          <h2>学内サーバ運用チェック</h2>
          <IssueList issues={institutionalIssues} emptyMessage="学内サーバ運用の前提条件を満たしています。" />
        </article>
      </section>

      <section className="card data-protection-table-section" aria-label="バックアップ復元計画">
        <div>
          <p className="eyebrow">Backup / Restore</p>
          <h2>バックアップ・復元</h2>
          <p>SQLite、PostgreSQL、プロジェクト単位JSONのバックアップ・復元手順を表示します。</p>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr><th>対象</th><th>バックアップ</th><th>復元</th><th>注意</th></tr>
            </thead>
            <tbody>
              {backupPlans.map((plan) => (
                <tr key={plan.target}>
                  <td>{backupTargetLabels[plan.target]}</td>
                  <td><code>{plan.command}</code></td>
                  <td><code>{plan.restoreCommand}</code></td>
                  <td>{plan.notes.join(' / ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="data-protection-card-grid" aria-label="プロジェクトJSONと論理削除">
        <article className="card data-protection-card">
          <p className="eyebrow">Project JSON</p>
          <h2>プロジェクト単位エクスポート</h2>
          <dl className="metadata-detail-list">
            <div><dt>スキーマ</dt><dd>{projectSnapshot.schemaVersion}</dd></div>
            <div><dt>研究課題</dt><dd>{projectSnapshot.projectId}</dd></div>
            <div><dt>DMP回答</dt><dd>{projectSnapshot.dmpAnswers.length}件</dd></div>
            <div><dt>Dataset</dt><dd>{projectSnapshot.datasets.length}件</dd></div>
          </dl>
          <IssueList issues={importIssues} emptyMessage="プロジェクトJSONの取り込み前チェックを通過しました。" />
        </article>
        <article className="card data-protection-card">
          <p className="eyebrow">Logical Delete</p>
          <h2>削除前確認・論理削除</h2>
          <dl className="metadata-detail-list">
            <div><dt>対象</dt><dd>{logicalDelete.entityType}:{logicalDelete.entityId}</dd></div>
            <div><dt>依頼者</dt><dd>{logicalDelete.requestedBy}</dd></div>
            <div><dt>モード</dt><dd>{logicalDelete.mode}</dd></div>
            <div><dt>削除日時</dt><dd>{logicalDelete.deletedAt ?? '未削除'}</dd></div>
          </dl>
        </article>
      </section>
    </>
  );
}

function IssueList({ issues, emptyMessage }: Readonly<{ issues: DataProtectionIssue[]; emptyMessage: string }>) {
  if (issues.length === 0) {
    return <p className="metadata-ok">{emptyMessage}</p>;
  }

  return (
    <ul className="dataset-issue-list">
      {issues.map((issue) => (
        <li key={`${issue.field}-${issue.message}`} data-severity={issue.severity}>
          <strong>{issue.message}</strong>
          <span>{issue.signal ? `${sensitiveDataSignalLabels[issue.signal]}: ` : ''}{issue.remediation}</span>
        </li>
      ))}
    </ul>
  );
}

function getPrincipleDescription(principle: string): string {
  if (principle === 'metadata_only') {
    return 'RDMate JPにはDMP、台帳、メタデータ、参照先URL、監査ログを保存し、研究データ本体は外部ストレージに置く設計です。';
  }

  if (principle === 'privacy_warning') {
    return '個人情報・要配慮情報の可能性がある場合は公開区分やライセンス判断に警告を出し、確認メモを残します。';
  }

  return '学内サーバ運用ではHTTPS、バックアップ、アクセス権限、セッション設定を前提条件としてチェックします。';
}
