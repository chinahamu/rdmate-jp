import { expect, test } from '@playwright/test';

test.describe('Storage reference management', () => {
  test('shows storage locations and manifest previews', async ({ page }) => {
    await page.goto('/storage');

    await expect(page.getByRole('heading', { name: '保存場所・参照管理' })).toBeVisible();
    await expect(page.getByText('保存場所・参照チェック')).toBeVisible();
    await expect(page.getByText('manifest.csv / manifest.json')).toBeVisible();
    await expect(page.getByLabel('manifest.csvプレビュー')).toHaveValue(/dataset_id,file_name/);
    await expect(page.getByRole('link', { name: 'manifest.csvを保存' })).toHaveAttribute(
      'href',
      '/api/storage/manifest/csv',
    );
  });
});
