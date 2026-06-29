# Changesets

RDMate JPは、自動リリースのRelease PR生成にChangesetsを利用します。

## 変更時の流れ

1. PRタイトルをConventional Commits形式にします。
2. リリース対象の変更では、changesetを追加します。
3. PRをmainへマージします。
4. `Release PR` workflowがChangesetsを集約し、バージョン更新PRを作成・更新します。
5. Release PRをレビューしてマージします。

## changesetの追加

```bash
pnpm changeset
```

対話形式で、patch/minor/majorのいずれかを選択し、変更内容を短く記載します。

## リリース種別

| 種別 | 用途 |
| --- | --- |
| patch | 不具合修正、軽微な改善、ドキュメント補足 |
| minor | 後方互換性のある機能追加 |
| major | 破壊的変更 |

## Release PRの扱い

Release PRは `chore(release): version packages` というタイトルで自動生成されます。PRには、バージョン更新、CHANGELOG更新、処理済みchangesetの削除が含まれます。
