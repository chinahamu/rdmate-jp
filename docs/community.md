# GitHubコミュニティ運用

このドキュメントでは、RDMate JPのIssue、Pull Request、Discussionsの使い分けと推奨カテゴリを説明します。

## 1. 基本方針

RDMate JPでは、利用者、管理者、DMPテンプレート作成者、開発者が参加しやすいように、GitHub上の導線を分けます。

| 用途 | 利用先 |
| --- | --- |
| 再現可能な不具合 | Bug Report Issue |
| 実装可能な機能提案 | Feature Request Issue |
| DMPテンプレートの追加・修正依頼 | DMP Template Request Issue |
| 実装前の相談・質問 | Discussions |
| コード・ドキュメント変更 | Pull Request |

Issueには、個人情報、秘密値、研究データ本体を貼り付けないでください。

## 2. Issue Template

`.github/ISSUE_TEMPLATE/` に次のIssue Formsを用意しています。

- `bug_report.yml`: 不具合報告
- `feature_request.yml`: 機能追加・改善提案
- `dmp_template_request.yml`: DMPテンプレート要望
- `config.yml`: 空Issue無効化、Discussionsとdocsへの誘導

## 3. Pull Request Template

`.github/pull_request_template.md` では、次の確認項目を用意しています。

- 変更概要
- 変更種別
- 影響範囲
- 検証コマンド
- 動作確認メモ
- データ保護・セキュリティ確認
- 関連Issue/PR

PRでは、実データ本体、個人情報、秘密値、`.env` を含めないことを必ず確認します。

## 4. Discussionsカテゴリ

GitHub Discussionsを有効化する場合は、次のカテゴリを推奨します。

| カテゴリ | 用途 | 推奨テンプレート |
| --- | --- | --- |
| Announcements | リリース、ロードマップ、重要なお知らせ | なし |
| Q&A | セットアップ、使い方、運用質問 | `q-and-a.yml` |
| Ideas | 将来機能、改善案、研究室運用アイデア | `ideas.yml` |
| DMP Templates | 新しいDMPテンプレート案の相談 | `dmp-template-proposal.yml` |
| Show and tell | 導入事例、テンプレート活用例 | なし |

カテゴリ作成はGitHubのRepository settingsで行います。リポジトリファイルとしては `.github/DISCUSSION_TEMPLATE/` にフォームを用意しています。

## 5. DiscussionsからIssueへの移行

次の条件を満たしたらIssueへ移します。

- 再現手順が明確な不具合になった。
- 実装範囲が明確な機能提案になった。
- DMPテンプレートの対象分野、設問、根拠が整理できた。
- ドキュメント修正箇所が具体化した。

Issue化する際は、DiscussionのURLをIssue本文に貼り、背景が追えるようにします。

## 6. ラベル運用の目安

| ラベル | 用途 |
| --- | --- |
| `bug` | 不具合 |
| `enhancement` | 機能追加・改善 |
| `template` | DMPテンプレート関連 |
| `documentation` | ドキュメント |
| `question` | 質問 |
| `needs-triage` | 初期確認待ち |
| `good first issue` | 初心者向け |
| `help wanted` | 協力歓迎 |

ラベル作成はGitHub上で行い、Issue Formsでは主要ラベルを自動付与します。

## 7. ライセンス

RDMate JP本体はMIT Licenseで配布します。詳細はリポジトリ直下の `LICENSE` を参照してください。

PRで新しい依存パッケージを追加・更新する場合は、次を確認します。

- パッケージのライセンスがOSS配布と互換性を持つ。
- `pnpm licenses:generate` を実行し、`THIRD_PARTY_LICENSES.md` の差分を確認する。
- `UNKNOWN` のライセンスがある場合は、公式リポジトリや配布物のライセンス表記を確認する。
- Docker imageやデスクトップ配布物に同梱すべきNOTICEがないか確認する。

詳しい手順は `docs/third-party-licenses.md` を参照してください。

## 8. 行動規範

RDMate JPでは、`CODE_OF_CONDUCT.md` に定める行動規範を適用します。

特に次を重視します。

- 相手の専門分野、経験、所属、言語、文化的背景を尊重する。
- 技術的な指摘は人格ではなく変更内容や根拠に向ける。
- 個人情報、秘密値、研究データ本体をIssue、PR、Discussionsへ投稿しない。
- 不確かな制度・助成要件・研究運用上の情報は断定せず、根拠や前提を示す。
- セキュリティ上の問題を公開Issueで悪用可能な形で投稿しない。

## 9. トリアージ手順

1. Issue種別とテンプレートの入力内容を確認します。
2. 個人情報、秘密値、実データ本体が含まれていないか確認します。
3. 再現性、影響範囲、優先度を確認します。
4. 必要なラベルを付与します。
5. 不足情報があれば質問します。
6. 実装可能なものはタスク化し、PRと紐付けます。

## 10. 管理者チェックリスト

- [ ] GitHub Discussionsを有効化した。
- [ ] 推奨カテゴリを作成した。
- [ ] `bug`、`enhancement`、`template`、`needs-triage` などのラベルを作成した。
- [ ] Issue Template Chooserで3種類のIssue Formが表示される。
- [ ] Pull Request作成時にPR Templateが表示される。
- [ ] DiscussionsでQ&A、Ideas、DMP Template Proposalのテンプレートが使える。
- [ ] `LICENSE` がMIT Licenseになっている。
- [ ] `CODE_OF_CONDUCT.md` を確認できる。
- [ ] `pnpm licenses:generate` でthird-party license一覧を生成できる。
