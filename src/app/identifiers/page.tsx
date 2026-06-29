import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { getSampleExternalIdentifierRegistry } from '@/server/external-identifiers';

export const metadata: Metadata = {
  title: '外部識別子 | RDMate JP',
};

export default function IdentifiersPage() {
  const registry = getSampleExternalIdentifierRegistry();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">External Identifiers</p>
        <h1>外部識別子</h1>
        <p>
          研究者ORCID、所属機関ROR、論文・データセット・ソフトウェアDOIを分離モデルで管理し、解決URLとメタデータ出力に利用します。
        </p>
      </section>

      <section className="card" aria-label="外部識別子一覧">
        <div>
          <p className="eyebrow">Identifier Registry</p>
          <h2>登録済み外部識別子</h2>
          <p>ORCID OAuth連携は将来拡張に備え、接続状態だけを保持します。</p>
        </div>
        <div className="dataset-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>種別</th>
                <th>対象</th>
                <th>ラベル</th>
                <th>ID</th>
                <th>接続状態</th>
              </tr>
            </thead>
            <tbody>
              {registry.identifiers.map((identifier) => (
                <tr key={identifier.id}>
                  <td>{identifier.type.toUpperCase()}</td>
                  <td>{identifier.entityType}</td>
                  <td>{identifier.label ?? identifier.entityId}</td>
                  <td>
                    <a href={identifier.resolveUrl}>{identifier.value}</a>
                  </td>
                  <td>{identifier.connection.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-label="DataCite作成者出力">
        <div>
          <p className="eyebrow">DataCite</p>
          <h2>機関識別子付き作成者メタデータ</h2>
          <p>ROR IDをDataCite風の affiliationIdentifier として出力できます。</p>
        </div>
        <pre>{JSON.stringify(registry.dataCiteCreators, null, 2)}</pre>
        <a className="secondary-button" href="/api/identifiers/sample">
          JSON API
        </a>
      </section>
    </AppShell>
  );
}
