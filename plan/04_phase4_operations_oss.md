# 04. フェーズ4：運用・OSS化

> 目標: 個人利用・研究室利用・学内サーバ利用に耐える運用機能、監査ログ、配布方式、OSSコミュニティ導線を整備する。

---

## 0. Phase 4 ゴール定義（Definition of Done）

- Docker Compose で学内サーバにデプロイできる。
- ローカルSQLite運用とPostgreSQL運用を切り替えられる。
- ユーザー・ロール・プロジェクト権限を管理できる。
- 監査ログとエクスポート履歴を保持できる。
- README / CONTRIBUTING / Issue Template / PR Template を整備する。
- GitHub Releases でバージョン付き配布ができる。

---

## 1. 利用モードと権限管理

### 1.1 利用モード

- [x] `local`: 個人PC・研究室PC向け。単一ユーザーを想定する。
- [x] `team`: 研究室内共有向け。複数ユーザーを想定する。
- [x] `institution`: 学内サーバ向け。管理者が複数研究課題を管理する。

### 1.2 ユーザーモデル

- [x] ユーザー名、メール、所属、ロールを管理する。
- [x] PI / Data Steward / Member / Viewer / Admin のロールを実装する。
- [x] 研究課題ごとに権限を設定できる。

### 1.3 アクセス制御

- [x] プロジェクト閲覧権限。
- [x] DMP編集権限。
- [x] データセット編集権限。
- [x] エクスポート権限。
- [x] 管理者設定権限。

---

## 2. 監査ログ・履歴管理

### 2.1 監査ログ

- [x] 研究課題作成・更新・削除。
- [x] DMP作成・更新・エクスポート。
- [x] データセット作成・更新・削除。
- [x] 公開区分・ライセンス変更。
- [x] 外部連携設定変更。

### 2.2 変更履歴

- [x] DMP回答の変更履歴を保存する。
- [x] データセットメタデータの変更履歴を保存する。
- [x] 変更前/変更後の差分を表示する。
- [x] バージョンタグを付与できる。

### 2.3 エクスポート履歴

- [x] 誰が、いつ、どの形式で、どのプロジェクトを出力したか記録する。
- [x] 出力ファイルのハッシュを保持する。
- [x] 再出力時に前回との差分を表示する。

---

## 3. データ保護・運用設計

### 3.1 基本方針

- [x] RDMate JPは原則として実データ本体を保持しない。
- [x] 個人情報・要配慮情報を含む可能性がある場合は警告し、公開判断を支援する。
- [x] 学内サーバ運用時はHTTPS、バックアップ、アクセス権限設定を前提とする。

### 3.2 実装項目

- [x] 入力値の形式検証をサーバ側でも実施する。
- [x] 権限チェックをサーバ側で強制する。
- [x] セッション管理を実装する。
- [x] 設定値を `.env` で管理し、`.env.example` を用意する。
- [x] 依存ライブラリ更新手順をドキュメント化する。

### 3.3 バックアップ

- [x] SQLiteバックアップ/復元機能。
- [x] PostgreSQLバックアップ手順のドキュメント化。
- [x] プロジェクト単位のJSONエクスポート/インポート。
- [x] 削除前の確認・論理削除の検討。

---

## 4. デプロイ・配布

### 4.1 ローカル開発/利用

- [x] `pnpm install` → `pnpm dev` で起動できる。
- [x] `.env.example` を整備する。
- [x] SQLiteデータベースを自動生成する。
- [x] サンプルデータ投入コマンドを用意する。

### 4.2 Docker Compose

- [x] `web` サービス。
- [x] `postgres` サービス（任意）。
- [x] `volume` にデータ永続化。
- [x] `docker compose up` で起動できる。
- [x] ヘルスチェックを設定する。

### 4.3 デスクトップ配布（検討）

- [ ] Tauriラッパーによるデスクトップ版を検討する。
- [ ] ローカルSQLiteを同梱する。
- [ ] Windows/macOS/Linuxの配布方式を整理する。
- [ ] Phase 4では調査・PoCまでを目標とする。

### 4.4 GitHub Releases

- [x] バージョンタグを付与する。
- [x] CHANGELOGを生成する。
- [x] Docker image を公開する。
- [x] Release Notesに移行手順を記載する。

---

## 5. CI/CD

### 5.1 GitHub Actions

- [ ] `lint`: ESLint / Prettier。
- [ ] `typecheck`: TypeScript strict。
- [ ] `test`: Vitest。
- [ ] `e2e`: Playwright。
- [ ] `build`: Next.js build。
- [ ] `docker-build`: Docker image build。

### 5.2 品質ゲート

- [ ] mainへのPRでCIを必須にする。
- [ ] カバレッジ閾値を設定する。
- [ ] 依存関係チェックを追加する。
- [ ] ライセンスチェックを追加する。

### 5.3 自動リリース

- [x] Conventional Commitsを採用する。
- [x] Changesetsまたはsemantic-releaseを検討する。
- [x] Release PRを自動生成する。

---

## 6. ドキュメント

### 6.1 利用者向け

- [x] `README.md`: 概要、スクリーンショット、クイックスタート。
- [x] `docs/getting-started.md`: 初回起動・研究課題作成・DMP作成。
- [x] `docs/dmp-templates.md`: テンプレートの選び方。
- [x] `docs/rdm-lite.md`: データセット台帳の使い方。
- [x] `docs/export.md`: 出力形式と用途。

### 6.2 管理者向け

- [x] `docs/deployment.md`: Docker Compose運用。
- [x] `docs/backup-restore.md`: バックアップ/復元。
- [x] `docs/permissions.md`: 権限・監査ログ・推奨設定。
- [x] `docs/migration.md`: バージョンアップ手順。

### 6.3 開発者向け

- [x] `CONTRIBUTING.md`: 開発環境、ブランチ、PRルール。
- [x] `docs/architecture.md`: アーキテクチャ詳細。
- [x] `docs/template-authoring.md`: DMPテンプレート作成方法。
- [x] `docs/api.md`: REST API/CLI仕様。

---

## 7. OSSコミュニティ導線

### 7.1 GitHub運用

- [x] Issue Template: Bug Report。
- [x] Issue Template: Feature Request。
- [x] Issue Template: DMP Template Request。
- [x] Pull Request Template。
- [x] Discussionカテゴリを用意する。

### 7.2 ライセンス・行動規範

- [x] MIT Licenseを追加する。
- [x] Code of Conductを追加する。
- [x] Third-party license一覧の生成方法を整備する。

### 7.3 貢献しやすいタスク

- [ ] `good first issue` ラベルを運用する。
- [ ] テンプレート追加タスクを初心者向けに切り出す。
- [ ] ドキュメント翻訳タスクを用意する。
- [ ] 大学・分野別テンプレートの要望をIssue化する。

---

## 8. 国際化・日本語対応

### 8.1 i18n設計

- [ ] UI文言を辞書ファイルに分離する。
- [ ] 日本語を既定、英語をオプションにする。
- [ ] DMPテンプレートはlocale別に持てるようにする。

### 8.2 日本の研究機関向け配慮

- [x] 日本語氏名・英語氏名を併記できる。
- [x] 所属部局・研究科・専攻を階層管理できる。
- [x] 科研費課題番号等の日本向け入力補助を追加する。
- [x] 日本語のDMP出力を標準にする。

---

## 9. テスト計画

### 9.1 権限テスト

- [ ] 権限なしユーザーが他プロジェクトを閲覧できない。
- [ ] ViewerがDMPを編集できない。
- [ ] API直接呼び出しでも権限チェックが適用される。
- [ ] エクスポート履歴が記録される。

### 9.2 デプロイテスト

- [ ] SQLiteモードで起動できる。
- [ ] PostgreSQLモードで起動できる。
- [ ] Docker Composeで起動できる。
- [ ] バックアップ/復元ができる。

### 9.3 リリーステスト

- [ ] タグ作成でRelease Notesが生成される。
- [ ] Docker imageがビルドされる。
- [ ] マイグレーションが既存データに適用できる。

---

## 10. Phase 4 完了条件

- 個人利用・研究室利用・学内サーバ利用の3モードに対応できる設計になっている。
- 権限・監査ログが実装されている。
- Docker Composeで再現可能に起動できる。
- OSSとして第三者がIssue/PRを出せるドキュメントが整備されている。
- GitHub Releasesでバージョン管理された配布ができる。
