# DMPテンプレート作成方法

このドキュメントでは、RDMate JPに新しいDMPテンプレートを追加する方法を説明します。テンプレートは `templates/dmp/` 配下のJSONファイルとして管理します。

## 1. テンプレートの役割

DMPテンプレートは、研究者が研究データ管理計画を作成するための質問セットです。助成機関、研究分野、利用言語、DMPバージョンに応じて選択できるようにします。

テンプレートには、次の情報を含めます。

- テンプレートID
- 表示名
- バージョン
- 言語・ロケール
- 対象助成機関
- 対象分野
- セクション
- 質問
- 互換バージョン
- メンテナンス情報

## 2. ファイル配置

```text
templates/
  dmp/
    generic-jp-v2.json
    japanese-funder-jp-v1.json
    nih-style-v1.json
```

新規テンプレートのファイル名は、IDと合わせることを推奨します。

例:

```text
templates/dmp/life-science-jp-v1.json
```

## 3. 最小構成

```json
{
  "id": "life-science-jp-v1",
  "name": "生命科学向け日本語DMPテンプレート",
  "version": "1.0.0",
  "locale": "ja",
  "language": "ja",
  "templateType": "discipline_specific",
  "description": "生命科学分野の研究データ管理に使うテンプレートです。",
  "targetFunder": "general",
  "targetDiscipline": "life_science",
  "targetFundingAgencyTypes": ["kakenhi", "amed", "other"],
  "sourceUrl": "https://github.com/chinahamu/rdmate-jp",
  "compatibleTemplateVersions": ["1.0.0"],
  "maintainer": "RDMate JP project",
  "lastReviewedAt": "2026-06-29",
  "lastUpdated": "2026-06-29",
  "sections": []
}
```

## 4. セクション

セクションはDMPの大見出しです。

```json
{
  "id": "data_description",
  "title": "研究データの概要",
  "description": "生成・収集するデータとメタデータ標準を整理します。",
  "order": 1,
  "questions": []
}
```

`id` は安定した識別子にしてください。表示名を変えても、既存回答と紐付けられるようにするためです。

## 5. 質問

質問はセクション内に配置します。

```json
{
  "id": "data_types",
  "label": "生成・収集するデータの種類",
  "type": "textarea",
  "required": true,
  "helpText": "観測データ、実験データ、調査票、画像、コードなどを記載します。",
  "order": 1
}
```

推奨する質問type:

| type | 用途 |
| --- | --- |
| `text` | 短い文字列 |
| `textarea` | 長い説明 |
| `select` | 単一選択 |
| `multi_select` | 複数選択 |
| `date` | 日付 |
| `url` | URL |
| `email` | メールアドレス |

## 6. 選択肢

`select` と `multi_select` では `options` を定義します。

```json
{
  "id": "sharing_policy",
  "label": "公開・共有方針",
  "type": "select",
  "required": true,
  "options": ["公開", "制限付き公開", "非公開", "未定"],
  "order": 2
}
```

選択肢を後から変更すると既存回答の意味が変わる可能性があります。値の削除や意味変更は破壊的変更として扱ってください。

## 7. バージョン管理

テンプレート更新時の原則:

- 表示文言の軽微な修正: patch更新
- 質問追加や任意項目追加: minor更新
- 質問IDの削除、意味変更、必須化: major更新

`compatibleTemplateVersions` には、移行可能な旧バージョンを記載します。

## 8. レビュー観点

Pull Requestでは次を確認してください。

- テンプレートIDが一意である。
- ファイル名とIDが対応している。
- `locale` と `language` が設定されている。
- セクションと質問の `order` が重複していない。
- `required` の理由が妥当である。
- 公開判断、保存場所、責任体制に関する質問が含まれている。
- 個人情報・要配慮情報・契約・知財に関する注意がある。
- 既存テンプレートとの違いが説明できる。

## 9. テスト

テンプレート追加後は、次を確認します。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm rdmate template list
```

`pnpm rdmate template list` の出力に新しいテンプレートが含まれるよう、CLIまたはテンプレート読み込み処理も必要に応じて更新してください。

## 10. ドキュメント更新

新しいテンプレートを追加した場合は、次のドキュメントも更新してください。

- `docs/dmp-templates.md`
- `README.md`
- 必要に応じて `docs/getting-started.md`

## 11. 禁止事項

- 実データ本体や個人情報をテンプレート例に含めない。
- 秘密値や内部URLをサンプルに含めない。
- 既存質問IDの意味を黙って変更しない。
- 助成機関要件を断定する場合は、根拠資料の確認をPRに記載する。
