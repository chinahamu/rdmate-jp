import {
  canPerformProjectAction,
  getProjectAssignmentForUser,
  getUsageModeCapabilities,
  permissionActionLabels,
  permissionActionValues,
  resolveProjectPermissions,
  summarizeAccessControl,
  usageModeLabels,
  usageModeValues,
  userRoleLabels,
  userRoleValues,
  validateAccessControlSetup,
  type AppUser,
  type ProjectPermissionAssignment,
  type UsageMode,
} from '@/domain/access-control';

const sampleProjectId = 'sample-project';

type AccessControlDashboardProps = Readonly<{
  mode: UsageMode;
  users: AppUser[];
  assignments: ProjectPermissionAssignment[];
}>;

export function AccessControlDashboard({ mode, users, assignments }: AccessControlDashboardProps) {
  const summary = summarizeAccessControl(mode, users, assignments);
  const issues = validateAccessControlSetup(mode, users, assignments);

  return (
    <>
      <section className="card access-control-summary" aria-label="利用モードと権限管理サマリー">
        <div>
          <p className="eyebrow">Usage Mode & Access Control</p>
          <h2>利用モードと権限管理</h2>
          <p>
            local / team / institution の利用モードに応じて、ユーザー、ロール、研究課題ごとの操作権限を管理します。
            UIだけでなくAPIやサーバ処理からも同じ判定関数を利用できます。
          </p>
        </div>
        <dl className="dataset-ledger-stats">
          <div><dt>利用モード</dt><dd>{usageModeLabels[summary.mode]}</dd></div>
          <div><dt>ユーザー</dt><dd>{summary.userCount}</dd></div>
          <div><dt>割当</dt><dd>{summary.assignmentCount}</dd></div>
        </dl>
      </section>

      <section className="access-control-card-grid" aria-label="利用モード一覧">
        {usageModeValues.map((usageMode) => {
          const capability = getUsageModeCapabilities(usageMode);
          return (
            <article key={usageMode} className="card access-control-card" data-active={usageMode === mode}>
              <p className="eyebrow">{usageMode}</p>
              <h2>{capability.label}</h2>
              <p>{capability.description}</p>
              <dl className="metadata-detail-list">
                <div><dt>研究課題割当</dt><dd>{capability.requiresProjectAssignment ? '必須' : '任意'}</dd></div>
                <div><dt>推奨管理者</dt><dd>{capability.expectedAdministrators}名以上</dd></div>
              </dl>
            </article>
          );
        })}
      </section>

      <section className="card access-control-role-matrix" aria-label="ロール別既定権限">
        <div>
          <p className="eyebrow">Role Matrix</p>
          <h2>ロール別の既定権限</h2>
          <p>PI / Data Steward / Member / Viewer / Admin の既定権限です。研究課題ごとの割当で個別に上書きできます。</p>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr>
                <th>ロール</th>
                {permissionActionValues.map((action) => (
                  <th key={action}>{permissionActionLabels[action]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userRoleValues.map((role) => {
                const permissions = resolveProjectPermissions({
                  id: `role-${role}`,
                  username: role,
                  email: `${role.toLowerCase()}@example.ac.jp`,
                  affiliation: 'RDMate JP',
                  role,
                  mode,
                });

                return (
                  <tr key={role}>
                    <th>{userRoleLabels[role]}</th>
                    {permissionActionValues.map((action) => (
                      <td key={action}>{permissions[action] ? '許可' : '不可'}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="access-control-card-grid" aria-label="ユーザー一覧">
        {users.map((user) => (
          <article key={user.id} className="card access-control-card">
            <div className="template-card__header">
              <div>
                <p className="eyebrow">{user.username}</p>
                <h2>{userRoleLabels[user.role]}</h2>
              </div>
              <strong>{user.mode}</strong>
            </div>
            <dl className="metadata-detail-list">
              <div><dt>メール</dt><dd>{user.email}</dd></div>
              <div><dt>所属</dt><dd>{user.affiliation}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <section className="card access-control-role-matrix" aria-label="研究課題別権限割当">
        <div>
          <p className="eyebrow">Project Permissions</p>
          <h2>研究課題ごとの権限</h2>
          <p>サンプル研究課題に対して、各ユーザーが実行できる操作をサーバ側の判定関数で表示します。</p>
          <a className="secondary-button" href="/api/access-control/summary">権限サマリーJSONを表示</a>
        </div>
        <div className="dataset-ledger-table-wrapper">
          <table className="dataset-ledger-table">
            <thead>
              <tr>
                <th>ユーザー</th>
                <th>割当ロール</th>
                {permissionActionValues.map((action) => (
                  <th key={action}>{permissionActionLabels[action]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const assignment = getProjectAssignmentForUser(assignments, sampleProjectId, user.id);
                return (
                  <tr key={user.id}>
                    <th>{user.username}<span>{user.affiliation}</span></th>
                    <td>{userRoleLabels[assignment?.role ?? user.role]}</td>
                    {permissionActionValues.map((action) => (
                      <td key={action}>
                        {canPerformProjectAction({ mode, user, projectId: sampleProjectId, assignment, action }) ? '許可' : '不可'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-label="権限設定チェック">
        <p className="eyebrow">Validation</p>
        <h2>権限設定チェック</h2>
        {issues.length > 0 ? (
          <ul className="dataset-issue-list">
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`} data-severity={issue.severity}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p className="metadata-ok">利用モード、ユーザー、研究課題権限の設定に重大な不足はありません。</p>
        )}
      </section>
    </>
  );
}
