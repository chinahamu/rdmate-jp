# 自動リリース運用

RDMate JPでは、Conventional Commits、Changesets、GitHub Actionsを組み合わせて、Release PR、バージョンタグ、GitHub Releases、Docker image公開を管理します。

## 1. 採用方針

| 項目 | 採用内容 |
| --- | --- |
| コミット/PR規約 | Conventional Commits |
| バージョン管理 | Changesets |
| Release PR生成 | `changesets/action` |
| バージョンタグ | `vX.Y.Z` 形式のannotated tag |
| GitHub Release作成 | `softprops/action-gh-release` |
| Docker image公開 | GitHub Container Registry (`ghcr.io`) |
| npm公開 | 当面なし |

RDMate JPはアプリケーションリポジトリであり、現時点ではnpmパッケージ公開を行いません。リリースは、バージョン更新、CHANGELOG更新、GitHub Release作成、Docker image公開を対象にします。

## 2. Conventional Commits

PRタイトルは次の形式にします。

```text
<type>(<scope>): <subject>
```

scopeは任意です。

例:

```text
feat: add dataset export preview
fix(dmp): handle missing template answers
docs(release): add release operation guide
chore(release): version packages
```

利用する主なtype:

| type | 用途 |
| --- | --- |
| `feat` | 新機能 |
| `fix` | 不具合修正 |
| `docs` | ドキュメント |
| `test` | テスト |
| `refactor` | 振る舞いを変えない整理 |
| `perf` | 性能改善 |
| `build` | ビルド設定 |
| `ci` | CI/CD |
| `chore` | 運用・保守 |
| `revert` | 取り消し |

`PR Title` workflowがPRタイトルを検証します。

## 3. changesetの追加

リリース対象の変更では、PR内でchangesetを追加します。

```bash
pnpm changeset
```

対話形式で、バージョン種別と変更内容を入力します。

| バージョン種別 | 用途 |
| --- | --- |
| `patch` | 不具合修正、軽微な改善 |
| `minor` | 後方互換性のある機能追加 |
| `major` | 破壊的変更 |

ドキュメントのみ、CIのみ、内部運用のみなど、リリースノート不要の変更ではchangesetを省略できます。その場合はPR本文に理由を記載します。

## 4. Release PR自動生成

`.github/workflows/release-pr.yml` は、`main` へのpushまたは手動実行で起動します。

処理内容:

1. 依存関係をインストールします。
2. `pnpm version-packages` を実行します。
3. 未処理のchangesetがある場合、`chore(release): version packages` PRを作成または更新します。
4. Release PRには、`package.json` のversion更新、CHANGELOG更新、処理済みchangesetの削除が含まれます。

## 5. バージョンタグ

Release PRをmainへマージすると、`.github/workflows/release-tag.yml` が起動します。

処理内容:

1. `package.json` の `version` を読み取ります。
2. `vX.Y.Z` 形式のタグ名を作成します。
3. 同じタグが存在しない場合、annotated tagを作成してpushします。
4. タグpushによりGitHub Release workflowが起動します。

手動でタグを作成する場合:

```bash
git checkout main
git pull
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

## 6. GitHub ReleaseとDocker image公開

`.github/workflows/github-release.yml` は、`v*.*.*` タグpushまたは手動実行で起動します。

実行内容:

1. `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` を実行します。
2. ソース配布用アーカイブ `rdmate-jp-vX.Y.Z.tar.gz` を作成します。
3. `SHA256SUMS` を生成します。
4. Docker imageをビルドします。
5. GitHub Container RegistryへDocker imageをpushします。
6. `scripts/generate-release-notes.mjs` でRelease Notesを生成します。
7. GitHub ReleaseへRelease Notesと成果物を添付します。

Docker image名:

```text
ghcr.io/chinahamu/rdmate-jp:X.Y.Z
ghcr.io/chinahamu/rdmate-jp:X.Y
ghcr.io/chinahamu/rdmate-jp:latest
```

`latest` は通常リリースのみに付与します。pre-releaseタグや手動実行でpre-release指定した場合は付与しません。

## 7. Release Notesと移行手順

Release Notesには次を含めます。

- CHANGELOGの対象バージョンセクション
- Docker imageのpullコマンド
- Docker Composeでのimage指定例
- SQLite/PostgreSQL運用の移行手順
- 検証項目
- 成果物一覧

Release Notes生成コマンド:

```bash
pnpm release:notes --tag v0.1.0 --image ghcr.io/chinahamu/rdmate-jp:0.1.0 --output RELEASE_NOTES.md
```

## 8. コマンド

| コマンド | 用途 |
| --- | --- |
| `pnpm changeset` | changesetを追加します。 |
| `pnpm version-packages` | changesetを集約してversion/CHANGELOGを更新します。 |
| `pnpm release:status` | mainとの差分からchangeset状態を確認します。 |
| `pnpm release:notes` | Release Notesを生成します。 |

## 9. リリース前チェック

Release PRをマージする前に、次を確認します。

- [ ] PRタイトルが `chore(release): version packages` になっている。
- [ ] versionの上がり方がchangesetと一致している。
- [ ] CHANGELOGの内容が利用者に理解できる。
- [ ] 実データ、秘密値、`.env` が含まれていない。
- [ ] 必要なCIが通っている。

GitHub Release作成後に、次を確認します。

- [ ] `vX.Y.Z` タグが存在する。
- [ ] GitHub ReleaseにRelease Notesと移行手順が記載されている。
- [ ] `rdmate-jp-vX.Y.Z.tar.gz` と `SHA256SUMS` が添付されている。
- [ ] GHCRにDocker imageが公開されている。
- [ ] Docker imageのタグが `X.Y.Z`、`X.Y`、必要に応じて `latest` になっている。

## 10. 手動リリース時の注意

緊急修正などで手動リリースする場合も、可能な限りRelease PRを経由してください。手動タグpushを行う場合は、CHANGELOG、package version、移行手順が最新であることを確認してからタグをpushします。
