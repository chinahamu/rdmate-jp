import { dmpCandidateLists, dmpExamplePhrases, dmpLabelDefinitions } from '@/domain/dmp-answer';

export function DmpHelperPanel() {
  return (
    <aside className="dmp-helper-panel" aria-label="DMP入力補助">
      <section>
        <h2>候補リスト</h2>
        <dl>
          <div>
            <dt>保存場所</dt>
            <dd>{dmpCandidateLists.storageLocations.join(' / ')}</dd>
          </div>
          <div>
            <dt>公開区分</dt>
            <dd>{dmpCandidateLists.sharingPolicies.join(' / ')}</dd>
          </div>
          <div>
            <dt>ライセンス</dt>
            <dd>{dmpCandidateLists.licenses.join(' / ')}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h2>よく使う文例</h2>
        <ul>
          {dmpExamplePhrases.map((phrase) => (
            <li key={phrase.id}>
              <strong>{phrase.label}</strong>
              <span>{phrase.value}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>ラベル定義</h2>
        <p>
          JA: {dmpLabelDefinitions.ja.required} / {dmpLabelDefinitions.ja.optional}
        </p>
        <p>
          EN: {dmpLabelDefinitions.en.required} / {dmpLabelDefinitions.en.optional}
        </p>
      </section>
    </aside>
  );
}
