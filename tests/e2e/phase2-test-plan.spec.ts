import { expect, test } from '@playwright/test';

test.describe('Phase 2 test plan', () => {
  test('can open dataset add flow for a DMP-created project', async ({ page }) => {
    await page.goto('/datasets');

    await expect(page.getByRole('heading', { name: 'データセット台帳' })).toBeVisible();
    await expect(page.getByText('研究データ管理支援ツールの実証研究')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dataset追加' })).toHaveAttribute('href', '/datasets/new');

    await page.getByRole('link', { name: 'Dataset追加' }).click();
    await expect(page.getByRole('heading', { name: 'データセット追加' })).toBeVisible();
    await expect(page.getByText('DMP作成済みプロジェクト')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dataset追加プレビューを生成' })).toBeVisible();
  });

  test('shows warnings for incomplete dataset ledger entries', async ({ page }) => {
    await page.goto('/datasets');

    await expect(page.getByText('UI評価スクリーンショット', { exact: true })).toBeVisible();
    await expect(page.getByText('保存場所が未設定です。パス・URL・外部IDのいずれかを登録してください。')).toBeVisible();
    await expect(page.getByText('ライセンスが未設定です。')).toBeVisible();
  });

  test('shows DMP difference report', async ({ page }) => {
    await page.goto('/dmp-diff');

    await expect(page.getByRole('heading', { name: 'DMPとの差分チェック' })).toBeVisible();
    await expect(page.getByText('プロジェクト単位の差分レポート')).toBeVisible();
    await expect(page.getByText('DMPを更新すべき項目')).toBeVisible();
    await expect(page.getByText('Datasetを修正すべき項目')).toBeVisible();
  });

  test('exports dataset ledger as CSV and JSON', async ({ page, request }) => {
    await page.goto('/datasets');

    await expect(page.getByRole('link', { name: 'CSVエクスポート' })).toHaveAttribute('href', '/api/datasets/export');
    await expect(page.getByRole('link', { name: 'JSONエクスポート' })).toHaveAttribute('href', '/api/datasets/export/json');

    const jsonResponse = await request.get('/api/datasets/export/json');
    expect(jsonResponse.ok()).toBe(true);
    expect(jsonResponse.headers()['content-type']).toContain('application/json');
    const json = await jsonResponse.json();
    expect(json.schemaVersion).toBe('1.0.0');
    expect(json.datasets.length).toBeGreaterThan(0);
  });
});
