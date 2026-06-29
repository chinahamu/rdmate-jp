# 開発環境セットアップ

## 前提

- Node.js LTS
- pnpm

## セットアップ

```bash
corepack enable
pnpm install --no-frozen-lockfile
cp .env.example .env
pnpm db:generate
pnpm dev
```

## 検証コマンド

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## ディレクトリ方針

- `src/app`: Next.js App Routerの画面・ルーティング
- `src/components`: 再利用可能なUIコンポーネント
- `src/domain`: RDMate JPのドメインモデル・純粋関数
- `src/server`: DBやサーバー側処理
- `src/lib`: 汎用ユーティリティ
- `templates/dmp`: DMPテンプレート定義
- `prisma`: SQLite向けPrismaスキーマとマイグレーション
- `tests/unit`: ユニットテスト
- `tests/e2e`: E2Eテスト
