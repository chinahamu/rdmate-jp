import { expect, test } from '@playwright/test';

test.describe('Metadata management', () => {
  test('shows metadata completion and schema export links', async ({ page }) => {
    await page.goto('/metadata');

    await expect(page.getByRole('heading', { name: 'メタデータ管理' })).toBeVisible();
    await expect(page.getByText('基本メタデータとリポジトリ登録チェック')).toBeVisible();
    await expect(page.getByText('再利用できるキーワード候補')).toBeVisible();
    await expect(page.getByText('RDMate共通スキーマ・DataCite変換')).toBeVisible();
    await expect(page.getByRole('link', { name: 'JSON Schemaを表示' })).toHaveAttribute(
      'href',
      '/api/metadata/schema',
    );
    await expect(page.getByLabel('DataCiteプレビュー')).toHaveValue(/resourceTypeGeneral/);
  });
});
