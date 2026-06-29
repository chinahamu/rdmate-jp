# E2E tests

Playwright による Phase 1 MVP の主要E2Eテストを配置するディレクトリです。

## 実行方法

```bash
pnpm exec playwright install --with-deps chromium
pnpm e2e
```

## 対象シナリオ

- 研究課題作成フォームに入力し、DMP入力画面へ遷移できる。
- DMP入力画面で必須項目未入力のエラーが表示される。
- DMPエクスポート画面でMarkdownプレビューを確認できる。
- JSON / CSV / DOCX の保存リンクが表示される。
