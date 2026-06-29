# DMP templates

DMPテンプレート定義を配置するディレクトリです。

Phase 3では、テンプレート定義をJSONで管理し、フォーム生成・バリデーション・テンプレートレジストリ・移行処理の入力として利用します。

## 同梱テンプレート

- `generic-jp-v1.json`: 日本語汎用テンプレート v1。`generic-jp-v2` への移行元として保持します。
- `generic-jp-v2.json`: 既定の日本語汎用テンプレート
- `university-basic-v1.json`: 大学研究室向け簡易テンプレート
- `japanese-funder-jp-v1.json`: JST / AMED / 科研費等を想定した日本語テンプレート
- `nih-style-v1.json`: NIH DMS Plan 風の英日併記テンプレート
- `human-subjects-jp-v1.json`: 人を対象とする研究向けテンプレート
- `life-science-medical-jp-v1.json`: 生命科学・医学系向けテンプレート
- `humanities-social-science-jp-v1.json`: 人文社会科学向けテンプレート
- `computational-ai-jp-v1.json`: 計算科学・AI研究向けテンプレート

## 定義要件

テンプレートは `src/domain/dmp-template.ts` のZodスキーマで検証します。

- `id`, `name`, `version`, `locale`, `templateType`, `lastUpdated` を持つ
- 後方互換のため `language` も読み取ります
- `targetFunder`, `targetDiscipline`, `targetFundingAgencyTypes` を持つ
- `sourceUrl`, `maintainer`, `lastReviewedAt` を任意または既定値付きで保持します
- 非推奨テンプレートは `deprecated.deprecatedAt`, `deprecated.replacedBy`, `deprecated.reason` で管理します
- 互換バージョンは `compatibleTemplateVersions` に保持します
- `sections` は `id`, `title`, `order`, `questions` を持つ
- `questions` は `id`, `label`, `type`, `required`, `order` を持つ
- `select` / `multi_select` 型の質問には `options` が必須
