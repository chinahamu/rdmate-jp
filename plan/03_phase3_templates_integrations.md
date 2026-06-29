# 03. フェーズ3：テンプレート・外部連携

> 目標: 助成機関・大学・研究分野別のDMPテンプレートを拡充し、GakuNin RDM・機関リポジトリ・識別子サービス・GitHub等と連携できる拡張基盤を整える。

---

## 0. Phase 3 ゴール定義（Definition of Done）

- 助成機関別・機関別・分野別テンプレートを追加できるテンプレートレジストリを実装する。
- テンプレートのバージョン管理、差分表示、移行処理を実装する。
- GakuNin RDM / JAIRO Cloud / Dataverse / Zenodo / GitHub など外部システムへ渡すメタデータ出力を実装する。
- ORCID / ROR / DOI 等の外部識別子を扱える。
- API・CLI による自動化導線を用意する。

---

## 1. テンプレートレジストリ拡張

### 1.1 テンプレート種別

- [x] 汎用DMPテンプレート。
- [x] 大学研究室向け簡易テンプレート。
- [x] JST/AMED/科研費等を想定した日本語テンプレート。
- [x] NIH DMS Plan 風テンプレート。
- [x] 人を対象とする研究向けテンプレート。
- [x] 生命科学・医学系向けテンプレート。
- [x] 人文社会科学向けテンプレート。
- [x] 計算科学・AI研究向けテンプレート。

### 1.2 テンプレートメタデータ

- [x] `id`, `name`, `version`, `locale`, `target_funder`, `target_discipline` を保持する。
- [x] `source_url`, `maintainer`, `last_reviewed_at` を保持する。
- [x] 非推奨テンプレートを管理する。
- [x] テンプレート互換バージョンを定義する。

### 1.3 テンプレート移行

- [x] 旧テンプレートで作成したDMPを新テンプレートへ移行できる。
- [x] 設問IDの対応表を持つ。
- [x] 移行できない項目を差分レポートに出す。
- [x] 旧回答を失わず履歴として保存する。

---

## 2. 助成機関別チェックルール

### 2.1 ルールエンジン

- [x] テンプレートにチェックルールを紐付ける。
- [x] ルールはJSON/YAMLで記述し、Zodで検証する。
- [x] `required`, `recommended`, `conditional`, `forbidden` のルール種別を持つ。
- [x] ルール違反時のメッセージを日本語/英語で定義する。

### 2.2 条件付きチェック

- [x] 個人情報あり → 匿名化・同意・アクセス制御の説明を必須化。
- [x] 国際共同研究あり → 国外移転・契約・アクセス制御の確認を促す。
- [x] 非公開データあり → 非公開理由と代替公開物の記載を必須化。
- [x] ソフトウェアを成果物に含む → ライセンス・リポジトリURLを必須化。

### 2.3 チェック結果出力

- [x] 助成機関別の適合状況をスコア表示する。
- [x] Markdown/PDFでレビュー用レポートを出力する。
- [x] URA・図書館担当者向けコメント欄を追加する。

---

## 3. 外部識別子連携

### 3.1 ORCID

- [x] 研究者プロフィールにORCID iDを登録できる。
- [x] ORCID形式を検証する。
- [x] 将来のOAuth連携に備えて外部IDモデルを分離する。

### 3.2 ROR

- [x] 所属機関にROR IDを登録できる。
- [x] 機関名とROR IDの紐付けを保持する。
- [x] メタデータ出力時に機関識別子を含める。

### 3.3 DOI

- [x] 論文DOI、データセットDOI、ソフトウェアDOIを登録できる。
- [x] DOI形式を検証する。
- [x] DOI解決URLを自動生成する。

---

## 4. GakuNin RDM連携設計

### 4.1 連携方針

- [x] Phase 3では公式API依存を避け、URL・プロジェクトID・保存場所の参照管理を基本にする。
- [x] GakuNin RDM上のプロジェクトURLをStorageLocationとして登録できる。
- [x] 将来APIが利用可能な環境向けにConnector Interfaceを定義する。

### 4.2 Connector Interface

- [x] `listProjects()`
- [x] `getProject(projectId)`
- [x] `listFiles(projectId)`
- [x] `exportMetadata(projectId, payload)`
- [x] `validateConnection()`

### 4.3 UI

- [x] 外部連携設定画面を追加する。
- [x] GakuNin RDM URLをデータセット保存場所へ紐付ける。
- [x] 連携状態を `未設定` / `参照登録済み` / `API連携済み` で表示する。

---

## 5. 機関リポジトリ・公開基盤向け出力

### 5.1 DataCite風JSON

- [x] データセットタイトル、作成者、出版年、機関、説明、キーワードを出力する。
- [x] 関連論文・関連コード・助成金情報を出力する。
- [x] ライセンス・権利情報を含める。

### 5.2 JAIRO Cloud想定CSV

- [x] リポジトリ担当者が確認しやすい列名でCSV出力する。
- [x] 日本語・英語タイトルに対応する。
- [x] DOI、URI、著者、所属、助成金番号、公開日を含める。

### 5.3 Dataverse / Zenodo向け出力

- [x] Dataverse JSON風の出力プリセットを用意する。
- [x] Zenodo metadata JSON風の出力プリセットを用意する。
- [x] API投稿はPhase 4以降のオプションとし、Phase 3ではファイル出力を優先する。

---

## 6. GitHub/GitLab連携

### 6.1 ソフトウェア成果物管理

- [x] 研究課題にコードリポジトリURLを紐付ける。
- [x] リポジトリ名、URL、ライセンス、主要ブランチ、リリースタグを保持する。
- [x] 論文・データセットとの関係を登録する。

### 6.2 再現性チェック

- [x] README有無。
- [x] LICENSE有無。
- [x] requirements / environment / Dockerfile 有無。
- [x] データ取得手順の記載有無。
- [x] リリースタグまたはコミットハッシュの固定有無。

### 6.3 GitHub Actions連携（任意）

- [x] RDMate CLI でメタデータJSONを生成できる。
- [x] GitHub Actions上で `rdmate validate` を実行できる。
- [x] 再現性チェック結果をPRコメントに出す拡張を検討する。

---

## 7. API / CLI

### 7.1 REST API

- [x] `/api/projects`
- [x] `/api/dmps`
- [x] `/api/datasets`
- [x] `/api/templates`
- [x] `/api/exports`
- [x] `/api/validators`

### 7.2 CLI

- [x] `rdmate init`
- [x] `rdmate import datasets.csv`
- [x] `rdmate export --format json`
- [x] `rdmate validate --project <id>`
- [x] `rdmate template list`

### 7.3 認証・権限

- [x] ローカル利用時は認証なし/簡易パスコードを選択できる。
- [x] 学内サーバ利用時はPhase 4の認証機能を使う。
- [x] APIトークンはプロジェクト単位で発行できる設計にする。

---

## 8. テスト計画

### 8.1 ユニットテスト

- [x] テンプレートバージョン移行。
- [x] 助成機関別チェックルール。
- [x] DataCite/JAIRO/Zenodo向け変換。
- [x] DOI/ORCID/ROR形式検証。
- [x] Connector Interfaceのモックテスト。

### 8.2 E2Eテスト

- [x] 新しいテンプレートを追加し、DMPを作成できる。
- [x] DMPを新テンプレートへ移行できる。
- [x] データセットをDataCite風JSONで出力できる。
- [x] GitHubリポジトリURLを成果物として登録できる。

---

## 9. Phase 3 完了条件

- テンプレート追加・更新・移行ができる。
- 助成機関別チェックルールを外部定義として管理できる。
- 外部リポジトリ向けのメタデータ出力が可能。
- ORCID/ROR/DOIを各モデルに紐付けられる。
- CLI/APIの最小セットが利用できる。
