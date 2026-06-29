import { expect, test } from '@playwright/test';

test.describe('DMP diff check', () => {
  test('shows DMP diff report and export links', async ({ page }) => {
    await page.goto('/dmp-diff');

    await expect(page.getByRole('heading', { name: 'DMPとの差分チェック' })).toBeVisible();
    await expect(page.getByText('プロジェクト単位の差分レポート')).toBeVisible();
    await expect(page.getByText('DMPを更新すべき項目')).toBeVisible();
    await expect(page.getByText('Datasetを修正すべき項目')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Markdownを保存' })).toHaveAttribute(
      'href',
      '/api/dmp-diff/report/markdown',
    );
    await expect(page.getByRole('link', { name: 'CSVを保存' })).toHaveAttribute(
      'href',
      '/api/dmp-diff/report/csv',
    );
    await expect(page.getByLabel('DMP差分JSONプレビュー')).toHaveValue(/schemaVersion/);
  });
});
