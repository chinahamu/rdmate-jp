# GUI表示付きE2E操作ガイド

RDMate JPを実際のブラウザ画面で表示しながら、研究課題作成、DMP入力、Dataset台帳、公開判断、権限・監査・データ保護までを自動操作で確認するための手順です。

## 1. 前提

```bash
corepack enable
pnpm install
```

Playwrightブラウザが未導入の場合は、次を実行します。

```bash
pnpm exec playwright install chromium
```

## 2. GUI表示付きの実務シナリオを実行する

```bash
pnpm e2e:gui
```

このコマンドは `playwright.gui.config.ts` を使い、Chromiumをheadedモードで開きます。画面上では次の流れが自動操作されます。

1. ホーム画面と主要ナビゲーション確認
2. 研究課題作成画面で課題名、研究分野、DMPテンプレートを入力
3. DMP入力画面で実務上の必須項目を入力
4. Dataset台帳をフィルタし、CSV/JSONエクスポート導線を確認
5. Dataset追加プレビューをフォーム送信で確認
6. 保存場所、メタデータ、公開・ライセンス、DMP差分、入出力を確認
7. 権限管理、監査履歴、データ保護、日本向け設定を確認
8. ヘルスチェック、権限サマリー、監査履歴サマリーAPIを確認

## 3. 既存E2Eをブラウザ表示付きで実行する

```bash
pnpm e2e:headed
```

通常の `playwright.config.ts` を使い、既存の全E2Eをブラウザ表示付きで実行します。

## 4. ステップ実行で調査する

```bash
pnpm e2e:debug
```

Playwright Inspectorでステップごとに止めながら確認できます。失敗箇所のセレクタ、画面状態、ネットワーク結果を確認する場合に使います。

## 5. 手動操作からテストコードを生成する

```bash
pnpm e2e:codegen
```

ブラウザを手動操作すると、Playwrightのコードが生成されます。新しい業務シナリオをE2E化する前のたたき台作成に使います。

## 6. 通常CIとの使い分け

- `pnpm e2e`: CIや自動検証向け。通常のheadless実行。
- `pnpm e2e:headed`: 既存E2Eを画面表示しながら確認。
- `pnpm e2e:gui`: 実務担当者向けの一連のGUI操作デモ。
- `pnpm e2e:debug`: 失敗時のステップ調査。
- `pnpm e2e:codegen`: 手動操作からのテスト生成。

GUI表示付きE2Eはローカル確認用です。CIでは通常の `pnpm e2e` を利用してください。
