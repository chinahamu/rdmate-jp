import { expect, test } from '@playwright/test';

test.describe('Related outputs', () => {
  test('shows related outputs and export links', async ({ page }) => {
    await page.goto('/related-outputs');

    await expect(page.getByRole('heading', { name: '関連成果物の紐付け' })).toBeVisible();
    await expect(page.getByText('Datasetと成果物の紐付け')).toBeVisible();
    await expect(page.getByText('Research data management workflow for Japanese laboratories', { exact: true })).toBeVisible();
    await expect(page.getByText('RDMate JP user test analysis scripts', { exact: true })).toBeVisible();
    await expect(page.getByText('プロトコル変更履歴 2件')).toBeVisible();
    await expect(page.getByRole('link', { name: 'JSONを表示' })).toHaveAttribute(
      'href',
      '/api/related-outputs/export/json',
    );
    await expect(page.getByRole('link', { name: 'CSVを保存' })).toHaveAttribute(
      'href',
      '/api/related-outputs/export/csv',
    );
    await expect(page.getByLabel('関連成果物JSONプレビュー')).toHaveValue(/schemaVersion/);
  });
});
