# Docker Compose運用

RDMate JPはDocker Composeでwebサービスを起動できます。既定構成はSQLiteを `/data` ボリュームに保存するため、単一サーバでの評価・小規模運用に向いています。学内サーバや研究室共有環境では、HTTPS終端、バックアップ、アクセス制御、ログ保全を組み合わせて運用してください。

## 1. 構成

| サービス/ボリューム | 用途 |
| --- | --- |
| `web` | Next.js standalone buildを起動します。 |
| `postgres` | `postgres` profileで起動できる任意のPostgreSQLサービスです。 |
| `app-data` | SQLite DBやバックアップを保存する永続化ボリュームです。 |
| `postgres-data` | PostgreSQLデータを保存する永続化ボリュームです。 |
| `/api/health` | Composeヘルスチェックで利用するAPIです。 |

## 2. ローカル評価用起動

```bash
cp .env.docker.example .env.docker.example.local
docker compose up --build
```

ブラウザで `http://localhost:3000` を開きます。既定ではSQLiteをDocker volumeに永続化します。

## 3. PostgreSQL profile

PostgreSQLを併用する場合は、Compose profileを指定して起動します。

```bash
docker compose --profile postgres up --build
```

PostgreSQL運用では、`DATABASE_URL`、DBユーザー、パスワード、DB名、保存ボリューム、バックアップ先を環境に合わせて設定します。

## 4. 環境変数

`.env.docker.example` を起点に、必要に応じて値を調整します。

| 変数 | 用途 |
| --- | --- |
| `DATABASE_URL` | SQLiteまたはPostgreSQLの接続先 |
| `RDMATE_USAGE_MODE` | `local` / `team` / `institution` の利用モード |
| `SESSION_SECRET` | セッション署名用の秘密値 |
| `RDMATE_FORCE_HTTPS` | HTTPS前提のCookie/リダイレクト制御 |
| `RDMATE_BACKUP_DIR` | バックアップ保存先 |
| `RDMATE_DISABLE_DATA_UPLOAD` | 実データ本体アップロード禁止の明示 |

本番相当の環境では、`SESSION_SECRET` は十分に長いランダム値に変更してください。

## 5. HTTPS終端

学内サーバで公開する場合は、RDMate JPの前段にリバースプロキシを置き、HTTPS終端を行います。

推奨構成:

- Nginx、Apache、CaddyなどでTLS終端
- `X-Forwarded-Proto` と `X-Forwarded-Host` の転送
- Cookie Secure属性の有効化
- 学内SSOやVPNとの併用
- HTTPからHTTPSへのリダイレクト

## 6. ヘルスチェック

`GET /api/health` は次のJSONを返します。

```json
{
  "ok": true,
  "service": "rdmate-jp"
}
```

Composeのヘルスチェック、ロードバランサ、死活監視で利用できます。

## 7. 永続化

SQLite運用では、DBファイルとバックアップを `app-data` volumeに保存します。PostgreSQL運用では `postgres-data` volumeにDBデータを保存します。

運用前に確認すること:

- volumeがホスト上の想定場所に永続化されているか
- バックアップ先が同一ディスク障害に巻き込まれないか
- バックアップファイルの読み取り権限が適切か
- 復元手順をリハーサル済みか

## 8. 起動・停止・更新

```bash
# 起動
docker compose up -d --build

# ログ確認
docker compose logs -f web

# 停止
docker compose down

# イメージ再ビルド
docker compose build --no-cache web
```

更新時は、事前にバックアップを取得し、`docs/migration.md` の手順に従ってください。

## 9. 管理者チェックリスト

- [ ] `RDMATE_USAGE_MODE` が運用形態と一致している。
- [ ] `SESSION_SECRET` を既定値から変更している。
- [ ] HTTPS終端を設定している。
- [ ] バックアップ保存先を確認している。
- [ ] `/api/health` の死活監視を設定している。
- [ ] 管理者、PI、Data Steward、Viewerの権限を確認している。
- [ ] 実データ本体をRDMate JPに保存しない運用を周知している。
