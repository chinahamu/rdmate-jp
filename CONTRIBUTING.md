# Contributing to RDMate JP

RDMate JPへのコントリビュートありがとうございます。このドキュメントでは、開発環境、ブランチ運用、Pull Requestの基本ルールを説明します。

## 1. 開発環境

前提:

- Node.js LTS
- pnpm / Corepack
- Git

セットアップ:

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

`pnpm dev` は `scripts/ensure-local-dev.mjs` を通じて、ローカル利用に必要な準備を自動実行します。セットアップ済みの環境でNext.jsだけを起動したい場合は、次を使います。

```bash
pnpm dev:next
```

## 2. 検証コマンド

Pull Request前に、可能な範囲で次を実行してください。

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

E2Eを確認する場合:

```bash
pnpm e2e
```

リリース対象の変更では、changeset状態も確認してください。

```bash
pnpm release:status
```

## 3. ブランチ運用

ブランチ名は作業内容が分かる名前にします。

例:

- `feature/dmp-template-selector`
- `feature/rdm-lite-metadata-export`
- `fix/import-validation-error`
- `docs/getting-started`
- `chore/dependency-update`

`main` に直接pushせず、作業ブランチからPull Requestを作成してください。

## 4. Conventional Commits

PRタイトルはConventional Commits形式にしてください。`PR Title` workflowで検証します。

形式:

```text
<type>(<scope>): <subject>
```

scopeは任意です。

例:

- `feat: add dataset export API`
- `fix(dmp): validate publication status before export`
- `docs(release): add automatic release guide`
- `test: add DMP diff unit tests`
- `chore(deps): update dependencies`

主なtype:

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `perf`
- `build`
- `ci`
- `chore`
- `revert`

破壊的変更では、PRタイトルに `!` を付けるか、changeset本文に明記してください。

## 5. Changesets

利用者に見える変更、バージョンに反映したい変更ではchangesetを追加します。

```bash
pnpm changeset
```

バージョン種別:

- `patch`: 不具合修正、軽微な改善
- `minor`: 後方互換性のある機能追加
- `major`: 破壊的変更

ドキュメントのみ、CIのみ、内部運用のみなど、リリースノート不要の変更ではchangesetを省略できます。その場合はPR本文に理由を記載してください。

`main` にchangesetがマージされると、`Release PR` workflowが `chore(release): version packages` PRを作成・更新します。

詳しくは `docs/release.md` を参照してください。

## 6. Pull Requestルール

Pull Requestには次を記載してください。

- 変更概要
- 変更した画面/API/ドキュメント
- 確認したコマンド
- Changesetの有無と理由
- スクリーンショットまたは動作確認メモ
- 既知の制約

PRを小さく保ち、1つのPRで複数の大きな機能を混ぜないでください。

## 7. コード方針

- TypeScript strictを前提にします。
- ドメインロジックは `src/domain` に寄せ、UIやAPIから再利用しやすくします。
- DBやサンプルデータに関する処理は `src/server` または `scripts` に分離します。
- Next.js App Routerの画面/APIは `src/app` に置きます。
- 実データ本体を保存する機能は追加しないでください。RDMate JPは管理情報と参照情報を扱います。

## 8. DMPテンプレート追加

テンプレート追加時は `templates/dmp/` にJSONを追加し、次を確認してください。

- `id` が一意である。
- `version` がsemverに近い形式である。
- `locale` と `language` が設定されている。
- `sections` と `questions` の `id` が安定している。
- 必須質問の意図が明確である。
- 既存テンプレートとの互換性を説明できる。

詳しくは `docs/template-authoring.md` を参照してください。

## 9. ドキュメント更新

利用者に影響する変更では、該当するドキュメントを更新してください。

- `README.md`
- `docs/getting-started.md`
- `docs/dmp-templates.md`
- `docs/rdm-lite.md`
- `docs/export.md`
- `docs/deployment.md`
- `docs/backup-restore.md`
- `docs/permissions.md`
- `docs/migration.md`
- `docs/release.md`
- `docs/api.md`

## 10. セキュリティとデータ保護

- 実データ本体、個人情報、秘密情報をリポジトリにコミットしないでください。
- `.env` をコミットしないでください。
- `.env.example` には安全なサンプル値だけを記載してください。
- 学内サーバ運用ではHTTPS、バックアップ、アクセス権限設定を前提にしてください。

## 11. Issueの書き方

バグ報告では、次を含めてください。

- 再現手順
- 期待した結果
- 実際の結果
- 利用モード
- 実行環境
- 関連ログ

機能要望では、次を含めてください。

- 利用者像
- 解決したい課題
- 期待する操作フロー
- 代替案
- 影響する画面/API/ドキュメント
