import { expect, test } from '@playwright/test';

test.describe('Publication license management', () => {
  test('shows publication statuses, license catalog, and assessment export', async ({ page }) => {
    await page.goto('/publication-license');

    await expect(page.getByRole('heading', { name: '公開区分・ライセンス管理' })).toBeVisible();
    await expect(page.getByText('公開区分・ライセンス判断')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ライセンス候補' })).toBeVisible();
    await expect(page.getByText('CC BY 4.0').first()).toBeVisible();
    await expect(page.getByRole('link', { name: '公開判断チェックJSONを表示' })).toHaveAttribute(
      'href',
      '/api/publication-license/assessment',
    );
  });
});
