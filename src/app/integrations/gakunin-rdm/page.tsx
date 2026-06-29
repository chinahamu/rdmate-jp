import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { getGakuninRdmConnectionStatusLabel } from '@/domain/gakunin-rdm';
import { getSampleGakuninRdmDashboard } from '@/server/gakunin-rdm';

export const metadata: Metadata = {
  title: 'GakuNin RDM連携 | RDMate JP',
};

export default async function GakuninRdmIntegrationPage() {
  const dashboard = await getSampleGakuninRdmDashboard();
  const storageLocation = dashboard.dataset.storageLocations.find((location) => location.storageType === 'gakunin_rdm_url');

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">External Integration</p>
        <h1>GakuNin RDM連携</h1>
        <p>
          Phase 3では公式APIに依存せず、GakuNin RDMプロジェクトURL・プロジェクトID・保存場所参照を管理します。将来APIが利用できる環境向けにConnector Interfaceを分離しています。
        </p>
      </section>

      <section className="card quality-summary" aria-label="GakuNin RDM連携状態">
        <div>
          <p className="eyebrow">Connection</p>
          <h2>{getGakuninRdmConnectionStatusLabel(dashboard.connection.status)}</h2>
          <p>{dashboard.validation.message}</p>
        </div>
        <dl className="quality-counts">
          <div>
            <dt>Mode</dt>
            <dd>{dashboard.connection.mode}</dd>
          </div>
          <div>
            <dt>Project ID</dt>
            <dd>{dashboard.connection.projectId}</dd>
          </div>
          <div>
            <dt>Files</dt>
            <dd>{dashboard.files.length}</dd>
          </div>
        </dl>
      </section>

      <section className="card" aria-label="GakuNin RDM設定">
        <p className="eyebrow">Settings</p>
        <h2>外部連携設定</h2>
        <div className="metadata-form-grid">
          <label>
            プロジェクトURL
            <input readOnly value={dashboard.connection.projectUrl ?? ''} />
          </label>
          <label>
            プロジェクトID
            <input readOnly value={dashboard.connection.projectId ?? ''} />
          </label>
          <label>
            連携状態
            <input readOnly value={getGakuninRdmConnectionStatusLabel(dashboard.connection.status)} />
          </label>
        </div>
      </section>

      <section className="card" aria-label="保存場所紐付け">
        <p className="eyebrow">Storage Location</p>
        <h2>データセット保存場所への紐付け</h2>
        <p>{dashboard.dataset.name}</p>
        {storageLocation ? (
          <ul className="storage-location-list">
            <li>
              <strong>{storageLocation.label}</strong>
              <code>{storageLocation.uri}</code>
              <span>
                {storageLocation.storageType} / {storageLocation.accessScope} /{' '}
                {storageLocation.hasBackup ? 'バックアップあり' : 'バックアップ未設定'} /{' '}
                {storageLocation.isEncrypted ? '暗号化あり' : '暗号化未設定'}
              </span>
            </li>
          </ul>
        ) : (
          <p>GakuNin RDM保存場所は未設定です。</p>
        )}
      </section>

      <section className="card" aria-label="Connector Interfaceプレビュー">
        <p className="eyebrow">Connector Interface</p>
        <h2>参照専用Connectorの結果</h2>
        <div className="dataset-ledger-actions">
          <a className="secondary-button" href="/api/integrations/gakunin-rdm/sample">
            JSON API
          </a>
        </div>
        <pre>{JSON.stringify({ project: dashboard.project, files: dashboard.files, exportPayload: dashboard.exportPayload }, null, 2)}</pre>
      </section>
    </AppShell>
  );
}
