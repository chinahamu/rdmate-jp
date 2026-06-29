# はじめに

このガイドでは、RDMate JPを初めて起動し、研究課題を作成してDMPを作成するまでの基本手順を説明します。

## 1. 前提

- Node.js LTSを利用します。
- pnpmはCorepack経由で有効化します。
- 既定のローカル利用ではSQLiteを使います。
- RDMate JPは研究データ本体を保持せず、DMP、Dataset台帳、メタデータ、保存場所の参照情報を管理します。

## 2. 初回起動

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` はローカル利用に必要な準備を自動実行します。

1. `.env` がない場合は `.env.example` から作成します。
2. Prisma Clientを生成します。
3. SQLiteスキーマを同期します。
4. サンプルデータを投入します。
5. Next.js開発サーバーを起動します。

起動後、ブラウザで `http://localhost:3000` を開きます。

## 3. 手動セットアップ

自動セットアップを分けて実行したい場合は、次の順序で実行します。

```bash
pnpm setup:local
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev:next
```

`pnpm setup:local` は `.env` 作成、Prisma Client生成、SQLite同期、サンプル投入をまとめて実行します。`pnpm dev:next` はセットアップ処理を挟まずNext.jsだけを起動します。

## 4. 研究課題の作成

サンプルデータでは研究課題、研究メンバー、助成情報、Dataset台帳が投入されています。新しい研究課題を作成する場合は、次の情報を揃えます。

| 項目 | 内容 |
| --- | --- |
| 課題名 | 研究課題またはプロジェクトの正式名称 |
| 概要 | 研究目的、対象、方法の短い説明 |
| 研究分野 | 分野名、研究科、専攻など |
| 期間 | 開始日、終了予定日 |
| 管理責任者 | PIまたはData Steward |
| 助成情報 | 助成機関、制度名、課題番号、年度 |

研究課題を作成したら、DMP、Dataset台帳、メタデータ、公開区分を順に入力します。

## 5. DMP作成

DMP作成では、テンプレートを選択し、研究データの概要、保存・共有方針、責任体制などを入力します。

推奨フローは次の通りです。

1. `docs/dmp-templates.md` を参照してテンプレートを選びます。
2. DMPの必須質問から先に回答します。
3. Dataset台帳に登録予定のデータ種別とDMPの記述を揃えます。
4. 公開・非公開の理由、保持期間、責任者を明記します。
5. `/dmp-diff` でDMP方針とDataset台帳の差分を確認します。

## 6. RDM Lite台帳の作成

`/datasets` でDataset台帳を作成します。最低限、次の情報を入力してください。

- データセット名
- 説明
- データ種別
- 作成者
- 管理責任者
- 生成日
- ステータス
- 公開区分

保存場所やファイルの実体はRDMate JPにアップロードせず、`/storage` で参照情報として登録します。

## 7. メタデータと公開判断

`/metadata` でタイトル、説明、作成者、キーワード、研究分野、取得方法、時間範囲、空間範囲を入力します。

`/publication-license` では、公開区分、公開予定日、DOI、ライセンス、利用条件、引用方法、非公開理由を確認します。個人情報、共同研究契約、特許出願予定がある場合は、公開判断を保留し、管理者またはData Stewardに確認してください。

## 8. エクスポート

成果物や機関リポジトリ登録に向けて、次の出力を利用します。

- Dataset台帳CSV
- ファイルマニフェストCSV/JSON
- DataCite/Dublin Core風JSON
- DMP差分レポート
- 完全JSON
- リポジトリ登録用CSV

詳しくは `docs/export.md` を参照してください。

## 9. 次に読むドキュメント

- DMPテンプレートの選び方: `docs/dmp-templates.md`
- RDM Liteの使い方: `docs/rdm-lite.md`
- 出力形式と用途: `docs/export.md`
- Docker Compose運用: `docs/deployment.md`
- 権限・監査ログ: `docs/permissions.md`
