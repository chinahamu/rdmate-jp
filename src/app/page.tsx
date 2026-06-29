import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import styles from './page.module.css';

const workflowSteps = [
  {
    title: '研究課題を作成',
    href: '/projects/new',
    actionLabel: '研究課題を作成する',
    description:
      '最初に研究課題名、研究分野、利用するDMPテンプレートを決め、DMP入力へ進むための起点を作ります。',
    items: [
      '研究課題名を入力',
      '研究分野を入力',
      '利用するDMPテンプレートを選択',
      '後続のDMP入力フォーム生成につなげる',
    ],
  },
  {
    title: 'DMPを作成',
    href: '/dmp/editor',
    actionLabel: 'DMP入力へ進む',
    description:
      '研究課題に対して、データ種別、保存方針、公開方針を定義し、後続作業の基準を作ります。',
    items: [
      'テンプレートを使って研究データ管理計画を入力',
      'データ種別、保存場所、保持期間、責任者を整理',
      '公開・共有方針とライセンス判断の前提を記録',
      '入力不足や要確認項目を次の台帳整備に引き継ぎ',
    ],
  },
  {
    title: 'データセット台帳を整備',
    href: '/datasets',
    actionLabel: 'データセット台帳を開く',
    description:
      'DMPに沿って、研究課題ごとのデータセットと責任者、状態、公開区分を登録します。',
    items: [
      'Datasetモデルと保存場所参照の管理',
      '研究課題別のデータセット一覧',
      'ステータス・公開区分・責任者・ライセンスのフィルタ',
      'CSVインポート/エクスポート',
      '未チェック/要対応データセットの強調表示',
    ],
  },
  {
    title: '保存場所・参照を登録',
    href: '/storage',
    actionLabel: '保存場所管理を開く',
    description:
      'データ本体を保持せず、ローカルパス、クラウドURL、GakuNin RDM URLなどの参照情報を管理します。',
    items: [
      '保存媒体種別・アクセス範囲・バックアップ・暗号化の管理',
      'URL形式・ローカルパス存在確認・保存場所未設定の検出',
      '重要データのバックアップ未設定警告',
      'ファイル名・相対パス・サイズ・ハッシュ・MIMEタイプのマニフェスト管理',
      'manifest.csv / manifest.json の出力',
    ],
  },
  {
    title: 'メタデータを補完',
    href: '/metadata',
    actionLabel: 'メタデータ管理を開く',
    description:
      '公開・再利用に必要な説明、作成者、時間/空間範囲、変数説明、関連資料を整理します。',
    items: [
      'タイトル・説明・作成者・所属・キーワード・研究分野・取得方法の管理',
      '時間範囲・空間範囲・変数/カラム説明の入力',
      '関連論文・関連ソフトウェアの紐付け',
      'Dublin Core / DataCite風マッピング',
      'メタデータ完成度スコアとリポジトリ登録前チェック',
    ],
  },
  {
    title: '公開区分・ライセンスを判断',
    href: '/publication-license',
    actionLabel: '公開・ライセンス管理を開く',
    description:
      '公開可否、利用条件、特許・共同研究契約・個人情報の懸念を確認して判断結果を残します。',
    items: [
      'open / embargoed / restricted / closed / undecided の公開区分管理',
      'CC BY 4.0 / CC0 1.0 / MIT などのライセンス候補管理',
      'PII可能性・共同研究契約・特許出願予定の公開判断チェック',
      'closed時の非公開理由入力チェック',
      '公開判断チェックJSONの出力',
    ],
  },
  {
    title: 'DMPとの差分をチェック',
    href: '/dmp-diff',
    actionLabel: 'DMP差分チェックを開く',
    description:
      'DMPと台帳・保存場所・公開方針の差分を確認し、修正すべき項目を切り分けます。',
    items: [
      'DMPで予定したデータ種別とDataset種別の差分検出',
      'DMP保存場所・公開方針・保持期間・責任者との整合性チェック',
      'エラー/警告/情報への分類',
      'DMP更新候補とDataset修正候補の分離',
      'Markdown / CSV / JSON の差分レポート出力',
    ],
  },
  {
    title: '関連成果物を紐付け',
    href: '/related-outputs',
    actionLabel: '関連成果物を開く',
    description:
      '論文、コード、プロトコル、手順書などをDatasetと結び、成果物の追跡性を高めます。',
    items: [
      '論文タイトル・DOI・arXiv URL・雑誌名・出版年の登録',
      'Datasetとの関係（使用・生成・補足・再解析）の紐付け',
      'GitHub/GitLab URL・リリースタグ・ライセンス・実行環境の管理',
      '生成コード・解析コード・可視化コードの関係管理',
      '手順書URL・プロトコルID・バージョン・責任者・変更履歴の記録',
    ],
  },
  {
    title: 'インポート/エクスポートを確認',
    href: '/import-export',
    actionLabel: '入出力管理を開く',
    description:
      '移行、バックアップ、リポジトリ登録に使うCSV/JSONの取り込み前確認と出力を行います。',
    items: [
      'データセット台帳CSVの取り込み前プレビュー',
      '必須列・重複データセット名・外部IDの検証',
      '研究課題、DMP、Dataset、メタデータ、関連成果物の完全JSON出力',
      'バックアップ/移行に使えるエクスポート形式',
      'DataCite相当/JAIRO Cloud向けCSVとフィールド不足チェック',
    ],
  },
  {
    title: '利用モードと権限を設定',
    href: '/access-control',
    actionLabel: '権限管理を開く',
    description:
      'チーム・機関運用に向けて、利用モード、ロール、研究課題ごとの権限を確認します。',
    items: [
      'local / team / institution の利用モード定義',
      'PI / Data Steward / Member / Viewer / Admin のロール管理',
      '研究課題ごとの権限割当と個別上書き',
      'プロジェクト閲覧・DMP編集・Dataset編集・出力・管理者設定の判定',
      '権限サマリーAPIと設定チェック',
    ],
  },
  {
    title: '監査ログ・履歴を確認',
    href: '/audit-history',
    actionLabel: '監査履歴を開く',
    description:
      '研究課題、DMP、Dataset、公開判断、外部連携設定の変更履歴を確認します。',
    items: [
      '研究課題・DMP・Datasetの作成/更新/削除ログ',
      '公開区分・ライセンス・外部連携設定変更の記録',
      'DMP回答とDatasetメタデータの変更前/変更後差分',
      'バージョンタグ付き変更履歴',
      'エクスポート履歴、出力ハッシュ、再出力差分',
    ],
  },
  {
    title: 'データ保護・バックアップを固める',
    href: '/data-protection',
    actionLabel: 'データ保護を開く',
    description:
      '本番運用前に、実データ非保持、個人情報警告、権限チェック、バックアップ/復元を確認します。',
    items: [
      'RDMate JPが実データ本体を保持しない方針の明示',
      '個人情報・要配慮情報・ローカルパスのサーバ側警告',
      'API直接呼び出しでも権限チェックを強制',
      'セッション管理と.env運用設定',
      'SQLite/PostgreSQL/プロジェクトJSONのバックアップ・復元と論理削除',
    ],
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Research Data Management</p>
        <h1>RDMate JP</h1>
        <p>
          大学・研究室向けに、研究データ管理計画（DMP）、データセット台帳、保存場所、
          メタデータ、公開判断、監査履歴をまとめて管理できるオープンソースアプリケーションです。
        </p>
      </section>

      <section className={styles.workflowIntro} aria-labelledby="workflow-heading">
        <p className="eyebrow">Recommended workflow</p>
        <h2 id="workflow-heading">作業するべき順番</h2>
        <p>
          まず研究課題を作成し、DMPで方針を決め、台帳・保存場所・メタデータを整備します。
          その後、差分確認、出力、権限、監査、データ保護の順で確認できます。
        </p>
      </section>

      <section className={styles.workflowFlow} aria-label="作業順の機能一覧">
        {workflowSteps.map((step, index) => (
          <article className={styles.flowCard} key={step.title}>
            <div className={styles.flowCardConnector} aria-hidden="true" />
            <div className={styles.flowCardNumber} aria-label={`手順${index + 1}`}>
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className={styles.flowCardBody}>
              <div className={styles.flowCardHeader}>
                <div>
                  <p className={styles.flowCardLabel}>Step {index + 1}</p>
                  <h2>{step.title}</h2>
                </div>
                {index < workflowSteps.length - 1 ? (
                  <span className={styles.flowCardNext}>次へ</span>
                ) : (
                  <span className={styles.flowCardNext}>完了</span>
                )}
              </div>
              <p className={styles.flowCardDescription}>{step.description}</p>
              <ul>
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="secondary-button" href={step.href}>
                {step.actionLabel}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
