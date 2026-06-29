# RDMate JP

RDMate JPは、日本語で研究データ管理計画（DMP: Data Management Plan）を作成・検証・出力するためのOSSアプリケーションです。個人研究者、研究室、学内サーバでの小規模運用を想定し、DMP作成、RDM Lite台帳、メタデータ管理、エクスポート、権限・監査ログ、Docker Compose運用までを実務で使いやすい形でまとめています。

## 主な提供機能

研究データ管理計画（DMP）作成、Dataset台帳、保存場所参照、メタデータ管理、公開区分・ライセンス判断、DMP差分チェック、インポート/エクスポート、権限管理、監査ログ、データ保護、日本の研究機関向け設定、自動リリース運用を提供しています。

- Next.js + TypeScript
- pnpm
- Prisma + SQLite
- ESLint / Prettier / TypeScript strict
- Vitest
- GitHub Actions CI

## スクリーンショット / 画面構成

現時点の主な画面は次の通りです。実データ本体は保持せず、DMP・台帳・メタデータ・参照情報を管理する構成です。

| 画面 | パス | 用途 |
| --- | --- | --- |
| DMP作成 | `/dmp` | テンプレートを選び、研究データ管理計画を作成します。 |
| Dataset台帳 | `/datasets` | 研究課題ごとのデータセット、責任者、状態を確認します。 |
| 保存場所・参照 | `/storage` | ローカルパス、クラウドURL、GakuNin RDM URLなどを参照情報として管理します。 |
| メタデータ | `/metadata` | DataCite/Dublin Core相当の基本メタデータを整理します。 |
| 公開区分・ライセンス | `/publication-license` | 公開可否、利用条件、ライセンス、非公開理由を確認します。 |
| DMP差分 | `/dmp-diff` | DMP方針とDataset台帳の差分を検出します。 |
| インポート/エクスポート | `/import-export` | CSV/JSONの取り込み前確認と出力を実行します。 |
| 権限管理 | `/access-control` | local/team/institutionモードとロール別権限を確認します。 |
| 監査ログ・履歴 | `/audit-history` | 操作ログ、変更履歴、エクスポート履歴を確認します。 |
| データ保護 | `/data-protection` | 個人情報警告、サーバ側検証、バックアップ方針を確認します。 |
| 日本向け設定 | `/japanese-institution` | 氏名併記、所属階層、科研費課題番号、日本語DMP出力を確認します。 |

## クイックスタート

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` 実行時に `.env` 作成、Prisma Client生成、SQLiteスキーマ同期、サンプルデータ投入が自動で行われます。開発サーバー起動後、ブラウザで `http://localhost:3000` を開きます。

手動で準備する場合は次を利用できます。

```bash
pnpm setup:local
pnpm db:generate
pnpm db:push
pnpm db:seed
```

詳しい初回手順は [`docs/getting-started.md`](docs/getting-started.md) を参照してください。

## Docker Compose起動

```bash
cp .env.docker.example .env.docker.example.local
docker compose up --build
```

既定ではSQLiteをDocker volumeに永続化して起動します。任意のPostgreSQLサービスは `postgres` profile で起動できます。ヘルスチェックは `/api/health` を利用します。詳細は [`docs/deployment.md`](docs/deployment.md) を参照してください。

## 検証

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
pnpm build
```

GUIを表示しながら実務操作シナリオを確認する場合は、次を利用します。

```bash
pnpm e2e:gui
```

既存E2Eをブラウザ表示付きで実行する場合は `pnpm e2e:headed`、Playwright Inspectorで調査する場合は `pnpm e2e:debug`、手動操作からコード生成する場合は `pnpm e2e:codegen` を使います。詳細は [`docs/gui-e2e.md`](docs/gui-e2e.md) を参照してください。

## 利用者向けドキュメント

- [`docs/getting-started.md`](docs/getting-started.md): 初回起動、研究課題作成、DMP作成
- [`docs/dmp-templates.md`](docs/dmp-templates.md): テンプレートの選び方
- [`docs/rdm-lite.md`](docs/rdm-lite.md): データセット台帳の使い方
- [`docs/export.md`](docs/export.md): 出力形式と用途
- [`docs/japanese-institution.md`](docs/japanese-institution.md): 日本の研究機関向け配慮

## 管理者向けドキュメント

- [`docs/deployment.md`](docs/deployment.md): Docker Compose運用
- [`docs/backup-restore.md`](docs/backup-restore.md): バックアップ/復元
- [`docs/permissions.md`](docs/permissions.md): 権限・監査ログ・推奨設定
- [`docs/migration.md`](docs/migration.md): バージョンアップ手順
- [`docs/release.md`](docs/release.md): 自動リリース運用

## 開発者向けドキュメント

- [`CONTRIBUTING.md`](CONTRIBUTING.md): 開発環境、ブランチ、PRルール
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md): 行動規範
- [`docs/development.md`](docs/development.md): 開発環境セットアップ
- [`docs/architecture.md`](docs/architecture.md): アーキテクチャ詳細
- [`docs/template-authoring.md`](docs/template-authoring.md): DMPテンプレート作成方法
- [`docs/api.md`](docs/api.md): REST API/CLI仕様
- [`docs/gui-e2e.md`](docs/gui-e2e.md): GUI表示付きE2E操作ガイド
- [`docs/third-party-licenses.md`](docs/third-party-licenses.md): third-party license一覧の生成方法

## RDM Lite: データセット台帳

`/datasets` で研究課題ごとのデータセット台帳を表示できます。

- Datasetモデル: データセット名、説明、データ種別、研究課題、作成者、責任者、生成日、更新日、バージョン、ステータスを管理
- 保存場所: ローカルパス、ネットワークドライブ、クラウドURL、GakuNin RDM URL、GitHub URLなどを複数登録
- 公開情報: 公開区分、公開予定日、公開URL、DOI、ライセンス、利用条件、引用方法を管理
- 一覧UI: データ種別、ステータス、公開区分、責任者、ライセンスでフィルタ
- CSV: `/api/datasets/export` で出力、`/api/datasets/import` にPOSTしてインポートプレビューを生成

## 運用機能

- `/access-control`: local / team / institution の利用モード、ユーザー、ロール、研究課題ごとの操作権限を確認できます。
- `/audit-history`: 研究課題、DMP、Dataset、公開判断、外部連携設定の操作ログと、変更履歴・エクスポート履歴を確認できます。
- `/data-protection`: 実データ本体を保持しない運用方針、個人情報・要配慮情報の警告、サーバ側検証、バックアップ/復元を確認できます。
- `/japanese-institution`: 日本語氏名・英語氏名、所属階層、科研費課題番号、日本語DMP出力を確認できます。

## リリース運用

PRタイトルはConventional Commits形式で管理し、リリース対象の変更はChangesetsでRelease PRを自動生成します。詳細は [`docs/release.md`](docs/release.md) を参照してください。

## ディレクトリ構成

```text
rdmate-jp/
  src/
    app/
    components/
    domain/
    server/
    lib/
  templates/
    dmp/
  prisma/
  tests/
    unit/
    e2e/
  plan/
  docs/
```

## ライセンス

RDMate JPはMIT Licenseで配布します。詳細は [`LICENSE`](LICENSE) を参照してください。

依存パッケージのライセンス一覧は、次のコマンドで生成できます。

```bash
pnpm install
pnpm licenses:generate
```

生成手順と確認観点は [`docs/third-party-licenses.md`](docs/third-party-licenses.md) を参照してください。

## 連絡先

お問い合わせやご意見は以下までご連絡ください。

- メール: ktwriter43@gmail.com

