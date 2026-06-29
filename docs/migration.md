# バージョンアップ手順

このドキュメントでは、RDMate JPを新しいバージョンへ更新するときの標準手順を説明します。学内サーバや研究室共有環境では、必ず事前バックアップと復元リハーサルを行ってください。

## 1. 基本方針

- 更新前にDBと完全JSONをバックアップします。
- 更新前後で `schemaVersion`、Prismaスキーマ、テンプレートバージョンを確認します。
- 破壊的変更がある場合は、移行手順とロールバック手順を事前に確認します。
- 実データ本体はRDMate JPの管理対象外です。外部保存場所のバックアップ方針も別途確認してください。

## 2. 更新前チェック

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

運用環境では、次も確認します。

- 現在のGitタグまたはコミットSHA
- 現在のDBバックアップ取得日時
- 現在の `.env` とDocker Compose設定
- 研究課題件数、Dataset件数、監査ログ件数
- 利用中のDMPテンプレートIDとバージョン

## 3. バックアップ

SQLiteの場合:

```bash
pnpm db:backup:sqlite
```

PostgreSQLの場合:

```bash
pg_dump "$DATABASE_URL" > backups/rdmate-before-upgrade.sql
```

研究課題単位の移行確認には、完全JSONも取得します。

```bash
curl http://localhost:3000/api/import-export/export/complete-json > backups/rdmate-complete.json
```

## 4. アプリ更新

Gitで更新する場合:

```bash
git fetch origin
git checkout main
git pull --ff-only
pnpm install
pnpm db:generate
pnpm db:push
pnpm build
```

Docker Composeで更新する場合:

```bash
git fetch origin
git checkout main
git pull --ff-only
docker compose build --no-cache web
docker compose up -d
```

PostgreSQL profileを使う場合:

```bash
docker compose --profile postgres up -d --build
```

## 5. DBスキーマ更新

開発・小規模運用では、Prisma schemaをDBへ同期します。

```bash
pnpm db:generate
pnpm db:push
```

マイグレーション履歴を厳密に管理する運用では、リリース手順に合わせて `prisma migrate` を使う方針へ切り替えてください。

## 6. テンプレート移行

DMPテンプレートの更新では、次を確認します。

- `id` と `version`
- `compatibleTemplateVersions`
- 質問IDの追加・変更・削除
- 必須項目の追加
- 選択肢の値変更
- 既存回答の移行可否

質問IDの意味が変わる場合は、既存回答を自動移行せず、移行メモを残してレビューしてください。

## 7. 更新後チェック

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

アプリ起動後に確認する画面/API:

- `/api/health`
- `/datasets`
- `/metadata`
- `/publication-license`
- `/dmp-diff`
- `/access-control`
- `/audit-history`
- `/data-protection`

確認観点:

- 研究課題件数が更新前と一致する。
- Dataset台帳が表示できる。
- DMPテンプレートが選択できる。
- エクスポートが実行できる。
- 権限チェックが想定通りに動作する。
- 監査ログが更新後も閲覧できる。

## 8. ロールバック

問題が見つかった場合は、次の順序で戻します。

1. アプリを停止します。
2. 更新後に生成されたバックアップやログを退避します。
3. Gitタグまたは更新前コミットへ戻します。
4. `pnpm install` またはDocker image再ビルドを実行します。
5. DBを更新前バックアップから復元します。
6. `/api/health` と主要画面を確認します。
7. 利用者へ影響範囲を報告します。

## 9. リリースノート確認項目

リリースごとに、次を確認してください。

- 追加機能
- 変更されたAPI
- 変更されたDMPテンプレート
- DBスキーマ変更
- 既知の制約
- 移行手順
- ロールバック注意点

## 10. 管理者チェックリスト

- [ ] 更新前バックアップを取得した。
- [ ] 復元手順を確認した。
- [ ] 利用者にメンテナンス時間を告知した。
- [ ] 更新後の主要画面を確認した。
- [ ] エクスポートと監査ログを確認した。
- [ ] 問題発生時の連絡先を明確にした。
