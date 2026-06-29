import { expect, test } from '@playwright/test';

test.describe('Import export', () => {
  test('shows import preview and export links', async ({ page }) => {
    await page.goto('/import-export');

    await expect(page.getByRole('heading', { name: 'インポート/エクスポート' })).toBeVisible();
    await expect(page.getByText('CSVプレビュー・完全JSON・リポジトリCSV')).toBeVisible();
    await expect(page.getByRole('heading', { name: '取り込み前プレビュー' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'CSVテンプレートを保存' })).toHaveAttribute(
      'href',
      '/api/import-export/template/dataset-csv',
    );
    await expect(page.getByRole('link', { name: '完全JSONを保存' })).toHaveAttribute(
      'href',
      '/api/import-export/export/complete-json',
    );
    await expect(page.getByRole('link', { name: 'リポジトリCSVを保存' })).toHaveAttribute(
      'href',
      '/api/import-export/export/repository-csv',
    );
    await expect(page.getByLabel('完全JSONプレビュー')).toHaveValue(/rdmate_complete_backup/);
    await expect(page.getByLabel('リポジトリCSVプレビュー')).toHaveValue(/dataset_id,title,creators/);
  });
});
