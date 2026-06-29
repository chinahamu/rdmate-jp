# REST API / CLI仕様

このドキュメントでは、RDMate JPの主なREST APIとCLIプレビューを説明します。APIはNext.js App RouterのRoute Handlerとして実装されています。

## 1. 共通方針

- APIはJSON、CSV、Markdownなど用途に応じた形式を返します。
- 管理対象はDMP、Dataset台帳、メタデータ、保存場所の参照情報、公開判断、関連成果物です。
- 実データ本体は返しません。
- 共有・学内運用では、API直接呼び出しにもサーバ側の権限チェックを適用します。
- 破壊的な更新APIを追加する場合は、監査ログの記録を必須にします。

## 2. ヘルスチェック

### `GET /api/health`

Docker Composeや監視で利用する死活確認APIです。

レスポンス例:

```json
{
  "ok": true,
  "service": "rdmate-jp"
}
```

## 3. Dataset台帳

### `GET /api/datasets/export`

Dataset台帳をCSVで出力します。

用途:

- 研究室内レビュー
- 台帳バックアップ
- 表計算ソフトでの確認

### `POST /api/datasets/import`

Dataset台帳CSVの取り込み前プレビューを生成します。

主な検証:

- 必須列
- 日付形式
- 重複データセット名
- DOI/公開URLの重複
- 責任者ID

## 4. 保存場所・ファイルマニフェスト

### `GET /api/storage/manifest/csv`

ファイルマニフェストをCSVで出力します。

### `GET /api/storage/manifest/json?datasetId=<datasetId>`

指定DatasetのファイルマニフェストをJSONで出力します。

レスポンスには、ファイル名、相対パス、サイズ、ハッシュ、MIMEタイプ、更新日時などを含めます。

## 5. メタデータ

### `GET /api/metadata/schema`

RDMate JP共通メタデータJSON Schemaを返します。

### `GET /api/metadata/export/datacite`

DataCite風JSONを返します。

### `GET /api/metadata/export/dublin-core`

Dublin Core風JSONを返します。

## 6. 公開区分・ライセンス

### `GET /api/publication-license/assessment`

公開判断チェックをJSONで返します。

主な確認項目:

- 公開区分
- ライセンス
- 個人情報の可能性
- 共同研究契約
- 特許出願予定
- 非公開理由
- 利用条件

## 7. DMP差分

### `GET /api/dmp-diff/report/markdown`

DMPとDataset台帳の差分をMarkdownで返します。

### `GET /api/dmp-diff/report/csv`

差分をCSVで返します。

### `GET /api/dmp-diff/report/json`

差分をJSONで返します。

差分はエラー、警告、情報に分類します。

## 8. 関連成果物

### `GET /api/related-outputs/export/json`

関連成果物一覧をJSONで返します。

### `GET /api/related-outputs/export/csv`

関連成果物一覧をCSVで返します。

対象:

- 論文・発表
- ソフトウェア/コード
- 実験・調査手順
- プロトコル変更履歴

## 9. インポート/エクスポート

### `GET /api/import-export/template/dataset-csv`

Dataset台帳CSVテンプレートを出力します。

### `GET /api/import-export/export/complete-json`

研究課題、DMP、Dataset、メタデータ、ファイルマニフェスト、関連成果物をまとめた完全JSONを返します。

### `GET /api/import-export/export/repository-csv`

JAIRO Cloud/DataCite相当のリポジトリ登録向けCSVを返します。

## 10. 権限管理

### `GET /api/access-control/summary`

利用モード、ユーザー、ロール、権限サマリー、研究課題割当、設定チェック結果を返します。

主なフィールド:

- `schemaVersion`
- `mode`
- `summary`
- `roles`
- `permissionActions`
- `assignments`
- `issues`

## 11. 監査ログ・履歴

### `GET /api/audit-history/summary`

監査ログ、DMP監査ログ、Dataset監査ログ、変更履歴、エクスポート履歴、差分比較を返します。

主なフィールド:

- `schemaVersion`
- `summary`
- `auditLogs`
- `dmpAuditLogs`
- `datasetAuditLogs`
- `changeHistory`
- `exportHistory`
- `exportComparisons`

## 12. データ保護

### `GET /api/data-protection/summary`

データ保護方針、個人情報・要配慮情報の警告、バックアップ計画、セッション設定、運用環境、プロジェクトJSON、論理削除情報を返します。

主なフィールド:

- `schemaVersion`
- `summary`
- `riskyIssues`
- `safeIssues`
- `institutionalIssues`
- `backupPlans`
- `sessionConfig`
- `operationEnv`
- `projectSnapshot`
- `importIssues`
- `logicalDelete`

## 13. 日本の研究機関向け配慮

### `GET /api/japanese-institution/summary`

日本語氏名・英語氏名、所属階層、科研費課題番号、日本語DMP出力設定をまとめたJSONを返します。

主なフィールド:

- `schemaVersion`
- `project`
- `summary`
- `profiles`
- `kakenhi`
- `dmpExportHints`

用途:

- 学内DMP提出前の氏名・所属表記確認
- 科研費課題番号の正規化候補確認
- 日本語DMP出力設定の確認
- 日本の研究機関向け運用チェック

## 14. CLIプレビュー

CLIは `scripts/rdmate-cli.mjs` で提供します。

### 初期化

```bash
pnpm rdmate init
```

サンプル研究課題と作成予定ファイルをJSONで出力します。

### Dataset CSVインポート

```bash
pnpm rdmate import datasets.csv
```

サンプルDatasetのインポート結果をJSONで出力します。

### JSONエクスポート

```bash
pnpm rdmate export --format json
```

サンプル研究課題、Dataset、テンプレートをJSONで出力します。Phase 3 CLIプレビューでは `json` のみ対応します。

### 検証

```bash
pnpm rdmate validate --project sample-project
```

指定研究課題の検証結果をJSONで出力します。

### テンプレート一覧

```bash
pnpm rdmate template list
```

利用可能なDMPテンプレート一覧をJSONで出力します。

## 15. API追加時のチェックリスト

- [ ] 入力値をサーバ側で検証している。
- [ ] 権限チェックをAPI側で強制している。
- [ ] 必要な監査ログを記録している。
- [ ] レスポンスに `schemaVersion` を含めるか検討している。
- [ ] CSV/JSON/MarkdownのContent-Typeを正しく設定している。
- [ ] 実データ本体を返していない。
- [ ] `docs/api.md` と関連ドキュメントを更新している。
