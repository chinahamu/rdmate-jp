import { expect, test, type Page, type TestInfo } from '@playwright/test';

const guiStepPauseMs = 400;

async function pauseForVisibleRun(page: Page, testInfo: TestInfo) {
  if (!testInfo.project.name.includes('gui')) return;

  await page.waitForTimeout(guiStepPauseMs);
}

async function openFromMainNav(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: '主要ナビゲーション' })
    .getByRole('link', { name: label, exact: true })
    .click();
}

test.describe('GUI guided practical workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('walks an operator through project, DMP, dataset, and governance checks', async ({ page, request }, testInfo) => {
    test.setTimeout(120000);
    await test.step('ホーム画面で主要ナビゲーションを確認する', async () => {
      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'RDMate JP' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: '主要ナビゲーション' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'データセット台帳', exact: true })).toBeVisible();
      await pauseForVisibleRun(page, testInfo);
    });

    await test.step('研究課題を入力しDMP入力へ進む', async () => {
      await openFromMainNav(page, '研究課題');

      await expect(page.getByRole('heading', { name: '研究課題を作成' })).toBeVisible();
      await page.getByLabel('研究課題名').fill('GUI表示E2E 実務検証プロジェクト');
      await page.getByLabel('研究分野').fill('情報学 / 研究データ管理');
      await page.getByLabel('DMPテンプレート').selectOption('generic-jp-v2');
      await expect(page.getByLabel('研究課題名')).toHaveValue('GUI表示E2E 実務検証プロジェクト');
      await pauseForVisibleRun(page, testInfo);

      await page.getByRole('link', { name: 'DMP入力へ進む' }).click();
      await expect(page).toHaveURL(/\/dmp\/editor$/);
      await expect(page.getByRole('heading', { name: 'DMP入力フォーム' })).toBeVisible();
      await pauseForVisibleRun(page, testInfo);
    });

    await test.step('DMPの実務必須項目を入力する', async () => {
      await page.getByLabel('主なファイル形式').fill('CSV, JSON, Markdown, DOCX');
      await page.getByLabel('主な保存場所').fill('GakuNin RDM / 研究室NAS / 機関リポジトリ');
      await page.getByLabel('公開・共有方針').selectOption('制限付き公開');
      await page.getByLabel('保持期間').fill('研究終了後5年間');
      await page.getByLabel('研究データ管理責任者').fill('佐藤 花子 / Data Steward');

      await expect(page.getByLabel('主なファイル形式')).toHaveValue('CSV, JSON, Markdown, DOCX');
      await expect(page.getByLabel('保持期間')).toHaveValue('研究終了後5年間');
      await pauseForVisibleRun(page, testInfo);
    });

    await test.step('Dataset台帳を絞り込み、エクスポート導線を確認する', async () => {
      await page.goto('/datasets');

      await expect(page.getByRole('heading', { name: 'データセット台帳' })).toBeVisible();
      await page.getByLabel('データ種別').selectOption('survey_data');
      await page.getByRole('button', { name: 'フィルタ' }).click();
      await expect(page).toHaveURL(/dataType=survey_data/);
      await expect(page.locator('.dataset-ledger-table').getByText('調査データ').first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'CSVエクスポート' })).toHaveAttribute('href', '/api/datasets/export');
      await expect(page.getByRole('link', { name: 'JSONエクスポート' })).toHaveAttribute(
        'href',
        '/api/datasets/export/json',
      );
      await pauseForVisibleRun(page, testInfo);
    });

    await test.step('Dataset追加プレビューをGUIから送信する', async () => {
      await page.goto('/datasets/new');
      await page.waitForSelector('form[data-hydrated="true"]');

      await expect(page.getByRole('heading', { name: 'データセット追加' })).toBeVisible();
      await page.getByLabel('データセット名').fill('GUI表示E2E アンケート集計データ');
      await page.getByLabel('データ種別').selectOption('survey_data');
      await page.getByLabel('公開区分').selectOption('undecided');
      await pauseForVisibleRun(page, testInfo);

      await page.getByRole('button', { name: 'Dataset追加プレビューを生成' }).click();
      await expect(page.locator('body')).toContainText('GUI表示E2E アンケート集計データ');
      await expect(page.locator('body')).toContainText('errors');
      await pauseForVisibleRun(page, testInfo);
    });

    const dashboardChecks = [
      {
        path: '/storage',
        heading: '保存場所・参照管理',
        text: '実ファイルをアプリに取り込まず',
      },
      {
        path: '/metadata',
        heading: 'メタデータ管理',
        text: 'Dublin Core / DataCite風マッピング',
      },
      {
        path: '/publication-license',
        heading: '公開区分・ライセンス管理',
        text: '契約・知財・PII観点',
      },
      {
        path: '/dmp-diff',
        heading: 'DMPとの差分チェック',
        text: 'DMP更新候補とDataset修正候補',
      },
      {
        path: '/import-export',
        heading: 'インポート/エクスポート',
        text: '完全JSON',
      },
      {
        path: '/access-control',
        heading: '利用モードと権限管理',
        text: 'ロール',
      },
      {
        path: '/audit-history',
        heading: '監査ログ・履歴管理',
        text: 'エクスポート履歴',
      },
      {
        path: '/data-protection',
        heading: 'データ保護・運用設計',
        text: '実データ本体を保持しない',
      },
      {
        path: '/japanese-institution',
        heading: '日本の研究機関向け配慮',
        text: '科研費課題番号',
      },
    ];

    for (const check of dashboardChecks) {
      await test.step(`${check.heading} を表示して実務レビュー観点を確認する`, async () => {
        await page.goto(check.path);

        await expect(page.getByRole('heading', { name: check.heading, level: 1 })).toBeVisible();
        await expect(page.getByText(check.text).first()).toBeVisible();
        await pauseForVisibleRun(page, testInfo);
      });
    }

    await test.step('主要サマリーAPIが実務確認に使えることを確認する', async () => {
      const healthResponse = await request.get('/api/health');
      expect(healthResponse.ok()).toBe(true);
      const health = await healthResponse.json();
      expect(health).toEqual({ ok: true, service: 'rdmate-jp' });

      const accessControlResponse = await request.get('/api/access-control/summary');
      expect(accessControlResponse.ok()).toBe(true);
      const accessControl = await accessControlResponse.json();
      expect(accessControl.schemaVersion).toBe('1.0.0');

      const auditHistoryResponse = await request.get('/api/audit-history/summary');
      expect(auditHistoryResponse.ok()).toBe(true);
      const auditHistory = await auditHistoryResponse.json();
      expect(auditHistory.schemaVersion).toBe('1.0.0');
    });
  });
});
