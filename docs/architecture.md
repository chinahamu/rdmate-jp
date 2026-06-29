# アーキテクチャ詳細

RDMate JPは、Next.js App Router、TypeScript、Prisma、SQLiteを中心に構成された研究データ管理支援アプリケーションです。実データ本体を保持せず、DMP、Dataset台帳、メタデータ、保存場所の参照情報、公開判断、関連成果物、監査ログを管理します。

## 1. 全体構成

```text
Browser
  |
  | HTTP
  v
Next.js App Router
  |
  | UI / API Routes
  v
Domain Functions ---- Server Data Access ---- Prisma Client ---- SQLite/PostgreSQL
  |
  v
Templates / Exporters / Validators
```

## 2. ディレクトリ

```text
src/
  app/         Next.js App Routerの画面・API
  components/ 画面で使うUIコンポーネント
  domain/     RDMate JPのドメインモデル・バリデーション・変換処理
  server/     DBアクセス、サンプルデータ、サーバ側処理
  lib/        汎用ユーティリティ
templates/
  dmp/        DMPテンプレートJSON
prisma/       Prismaスキーマ
tests/        unit/e2eテスト
scripts/      セットアップ、seed、バックアップ、CLI
```

## 3. App Router

`src/app` は画面とAPIを持ちます。

主な画面:

- `/datasets`
- `/storage`
- `/metadata`
- `/publication-license`
- `/dmp-diff`
- `/related-outputs`
- `/import-export`
- `/access-control`
- `/audit-history`
- `/data-protection`

主なAPI:

- `/api/health`
- `/api/datasets/export`
- `/api/datasets/import`
- `/api/storage/manifest/csv`
- `/api/storage/manifest/json`
- `/api/metadata/schema`
- `/api/metadata/export/datacite`
- `/api/metadata/export/dublin-core`
- `/api/publication-license/assessment`
- `/api/import-export/export/complete-json`
- `/api/import-export/export/repository-csv`
- `/api/access-control/summary`
- `/api/audit-history/summary`
- `/api/data-protection/summary`

## 4. Domain層

`src/domain` は、UIやAPIから独立して再利用できる純粋関数を中心にします。

責務:

- Dataset台帳の整形・CSV生成
- 保存場所の参照チェック
- メタデータスキーマ生成
- 公開判断チェック
- DMP差分分類
- 関連成果物の変換
- 権限判定
- 監査ログ集計
- データ保護バリデーション

ドメイン層には、ブラウザAPIやDB接続に依存する処理を置かない方針です。

## 5. Server層

`src/server` は、Prisma、サンプルデータ、サーバ側ユースケースを扱います。

責務:

- DBから研究課題・Dataset・メタデータを取得する。
- サンプルデータをAPIや画面へ供給する。
- サーバ側バリデーション結果を組み立てる。
- 運用モード、セッション、バックアップ設定を読み込む。

## 6. Prismaモデル

主なモデル:

| モデル | 用途 |
| --- | --- |
| `ResearchProject` | 研究課題 |
| `ResearchMember` | 研究メンバー |
| `Funding` | 助成情報 |
| `Dataset` | Dataset台帳 |
| `DatasetStorageLocation` | 保存場所の参照情報 |
| `DatasetFileManifestEntry` | ファイルマニフェスト |
| `DatasetMetadata` | 基本メタデータ |
| `DatasetPublicationDecision` | 公開判断 |
| `DatasetRelatedOutput` | 関連成果物 |
| `ProtocolChangeRecord` | 手順変更履歴 |

既定はSQLiteですが、Docker Compose運用ではPostgreSQL profileも想定します。

## 7. DMPテンプレート

DMPテンプレートは `templates/dmp/` にJSONとして配置します。

テンプレートの主な属性:

- `id`
- `name`
- `version`
- `locale`
- `language`
- `templateType`
- `targetFunder`
- `targetDiscipline`
- `compatibleTemplateVersions`
- `sections`
- `questions`

テンプレート作成ルールは `docs/template-authoring.md` を参照してください。

## 8. エクスポート設計

エクスポートは、用途に応じてCSV、JSON、Markdownを返します。

- 表計算レビュー: CSV
- 外部システム連携: JSON
- 人間向けレビュー: Markdown
- 研究課題単位の移行: 完全JSON
- 機関リポジトリ登録: リポジトリCSV、DataCite/Dublin Core風JSON

エクスポート履歴には、出力者、形式、研究課題、ファイル名、ハッシュ、再出力差分を残します。

## 9. 権限・監査設計

権限は、ロールと研究課題単位の割当を組み合わせて判定します。

操作権限:

- `view_project`
- `edit_dmp`
- `edit_dataset`
- `export_project`
- `manage_settings`

監査ログは、研究課題、DMP、Dataset、公開判断、外部連携、権限変更、エクスポートを対象にします。

## 10. データ保護設計

RDMate JPは実データ本体を保持しません。

保存するもの:

- DMP回答
- Dataset台帳
- 保存場所の参照URL/パス
- メタデータ
- 公開判断
- 関連成果物
- 監査ログ

保存しないもの:

- 研究データ本体
- 機微な原データファイル
- 解析済み大容量ファイル
- 秘密値を含む `.env`

個人情報・要配慮情報を含む可能性がある場合は警告し、公開判断を支援します。

## 11. CLI

`scripts/rdmate-cli.mjs` はPhase 3時点のCLIプレビューです。

```bash
pnpm rdmate init
pnpm rdmate import datasets.csv
pnpm rdmate export --format json
pnpm rdmate validate --project sample-project
pnpm rdmate template list
```

CLIは自動化・外部連携の足場として利用し、今後のAPI/CLI仕様の安定化に合わせて拡張します。
