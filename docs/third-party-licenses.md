# Third-party license一覧の生成方法

RDMate JP本体はMIT Licenseで配布します。依存パッケージは、それぞれのパッケージが定めるライセンスに従います。このドキュメントでは、依存パッケージのライセンス一覧を生成・確認する手順を説明します。

## 1. 生成コマンド

依存パッケージをインストールした後、次を実行します。

```bash
pnpm install
pnpm licenses:generate
```

生成結果はリポジトリ直下の `THIRD_PARTY_LICENSES.md` に出力されます。

## 2. 生成スクリプト

`pnpm licenses:generate` は次のスクリプトを実行します。

```bash
node scripts/generate-third-party-licenses.mjs
```

このスクリプトは `node_modules` 内の `package.json` を走査し、次の情報をMarkdown表として出力します。

| 項目 | 説明 |
| --- | --- |
| Package | パッケージ名 |
| Version | パッケージバージョン |
| License | `package.json` の `license` または `licenses` |
| Type | `dependency` / `devDependency` / `transitive` |
| Repository / Homepage | リポジトリURLまたはホームページ |

## 3. リリース前チェック

リリース前には、生成された `THIRD_PARTY_LICENSES.md` を確認してください。

```bash
pnpm licenses:generate
git diff -- THIRD_PARTY_LICENSES.md
```

確認観点:

- `UNKNOWN` のライセンスがないか。
- ライセンスが商用利用・再配布・改変に対して互換性があるか。
- 直接依存とdevDependencyの区別が妥当か。
- リポジトリURLやホームページが空欄のパッケージがないか。
- 依存パッケージ更新後に一覧が再生成されているか。

## 4. `UNKNOWN` が出た場合

`UNKNOWN` が出た場合は、次の順序で確認します。

1. 対象パッケージの `package.json` を確認します。
2. パッケージの公式リポジトリにある `LICENSE`、`COPYING`、`NOTICE` を確認します。
3. npmパッケージページのライセンス表記を確認します。
4. 確認結果をPR本文に記載します。
5. 必要であれば、依存パッケージの変更または代替を検討します。

## 5. 生成結果の扱い

`THIRD_PARTY_LICENSES.md` は依存関係の概要確認を目的とした生成物です。各依存パッケージに同梱されるライセンステキストやNOTICEファイルを置き換えるものではありません。

配布物に同梱する場合は、次を確認してください。

- RDMate JP本体の `LICENSE` を含める。
- `THIRD_PARTY_LICENSES.md` を含める。
- 必要に応じて依存パッケージのNOTICEやライセンステキストを含める。
- Docker imageやデスクトップ配布物では、ビルド時点の生成結果を同梱する。

## 6. CIでの利用案

将来的には、次のようなCIチェックを追加できます。

```bash
pnpm install --frozen-lockfile
pnpm licenses:generate
git diff --exit-code THIRD_PARTY_LICENSES.md
```

このチェックにより、依存関係を更新したPRでthird-party license一覧の更新漏れを検出できます。
