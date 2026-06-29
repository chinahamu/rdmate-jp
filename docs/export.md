# 出力形式と用途

RDMate JPは、DMP、Dataset台帳、保存場所、メタデータ、公開判断、関連成果物を複数の形式で出力します。このドキュメントでは、用途ごとに推奨する出力形式を説明します。

## 1. 出力方針

- 実データ本体は出力対象に含めません。
- 出力対象はDMP、台帳、メタデータ、保存場所の参照情報、公開判断、関連成果物、監査・履歴情報です。
- 研究課題単位での移行・確認には完全JSONを使います。
- 機関リポジトリ登録にはCSVまたはDataCite/Dublin Core風JSONを使います。
- 監査・再現性確認にはエクスポート履歴とハッシュを残します。

## 2. Dataset台帳CSV

エンドポイント: `GET /api/datasets/export`

用途:

- 研究室内レビュー
- 表計算ソフトでの確認
- 管理台帳の定期保存

出力例の主な列:

- dataset id
- project id
- name
- description
- data type
- generated date
- responsible member
- status
- publication status
- license

## 3. Dataset CSVインポートプレビュー

エンドポイント: `POST /api/datasets/import`

用途:

- 既存台帳CSVの取り込み前確認
- 必須列、型、重複、DOI/公開URLの検証
- 本番投入前のエラー確認

取り込み前には、重複データセット名、公開URL、DOI、責任者ID、日付形式を確認してください。

## 4. ファイルマニフェスト

エンドポイント:

- `GET /api/storage/manifest/csv`
- `GET /api/storage/manifest/json?datasetId=<datasetId>`

用途:

- ファイル一覧の保全
- ハッシュ確認
- リポジトリ登録前の付属資料
- 研究終了時の保管記録

マニフェストにはファイル名、相対パス、サイズ、ハッシュ、MIMEタイプ、更新日時を含めます。

## 5. メタデータJSON

エンドポイント:

- `GET /api/metadata/schema`
- `GET /api/metadata/export/datacite`
- `GET /api/metadata/export/dublin-core`

用途:

- メタデータ項目の確認
- DataCite風JSONの作成
- Dublin Core風JSONの作成
- 機関リポジトリや外部システムへのマッピング検討

公開前には、タイトル、作成者、所属、キーワード、研究分野、取得方法、時間範囲、空間範囲、ライセンスを確認してください。

## 6. 公開判断チェックJSON

エンドポイント: `GET /api/publication-license/assessment`

用途:

- 公開可否のレビュー
- 非公開理由の記録
- 共同研究契約・特許出願予定の確認
- Data Stewardまたは管理者への相談資料

個人情報、共同研究契約、特許出願予定がある場合は、公開区分を `open` にする前に根拠を残します。

## 7. DMP差分レポート

エンドポイント:

- `GET /api/dmp-diff/report/markdown`
- `GET /api/dmp-diff/report/csv`
- `GET /api/dmp-diff/report/json`

用途:

- DMPとDataset台帳の整合性確認
- 研究計画変更時のレビュー
- 研究終了時の確認資料

Markdownは人間向けレビュー、CSVは台帳確認、JSONは外部ツール連携に向いています。

## 8. 関連成果物一覧

エンドポイント:

- `GET /api/related-outputs/export/json`
- `GET /api/related-outputs/export/csv`

用途:

- 論文・発表・ソフトウェア・手順書とDatasetの関係確認
- 研究成果物の棚卸し
- リポジトリ登録時の補足資料

## 9. 完全JSON

エンドポイント: `GET /api/import-export/export/complete-json`

用途:

- 研究課題単位のバックアップ
- 研究室内サーバ間の移行
- 監査・検証用スナップショット

完全JSONには、研究課題、DMP、Dataset、保存場所、メタデータ、ファイルマニフェスト、関連成果物などの管理情報を含めます。実データ本体は含めません。

## 10. リポジトリCSV

エンドポイント: `GET /api/import-export/export/repository-csv`

用途:

- JAIRO Cloud/DataCite相当の項目整理
- 機関リポジトリ登録前の不足チェック
- 公開予定Datasetの棚卸し

出力後は、必須メタデータ、ライセンス、公開URL、DOI、作成者、所属、公開区分を確認してください。

## 11. CLIプレビュー

`pnpm rdmate` でCLIプレビューを実行できます。

```bash
pnpm rdmate init
pnpm rdmate import datasets.csv
pnpm rdmate export --format json
pnpm rdmate validate --project sample-project
pnpm rdmate template list
```

CLIはPhase 3時点のプレビューです。自動処理に組み込む場合は、出力の `schemaVersion` と `generatedBy` を確認してください。

## 12. エクスポート履歴

エクスポート時は、誰が、いつ、どの形式で、どの研究課題を出力したかを記録します。出力ファイルのハッシュを保持し、再出力時に前回との差分を確認します。
