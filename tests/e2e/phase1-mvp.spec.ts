import { expect, test } from '@playwright/test';

test.describe('Phase 1 MVP flow', () => {
  test('creates a research project draft and opens the DMP editor', async ({ page }) => {
    await page.goto('/projects/new');

    await expect(page.getByRole('heading', { name: '研究課題を作成' })).toBeVisible();
    await page.getByLabel('研究課題名').fill('E2E研究課題');
    await page.getByLabel('研究分野').fill('情報学');
    await page.getByLabel('DMPテンプレート').selectOption('generic-jp-v2');

    await expect(page.getByLabel('研究課題名')).toHaveValue('E2E研究課題');
    await expect(page.getByLabel('研究分野')).toHaveValue('情報学');

    await page.getByRole('link', { name: 'DMP入力へ進む' }).click();
    await expect(page).toHaveURL(/\/dmp\/editor$/);
    await expect(page.getByRole('heading', { name: 'DMP入力フォーム' })).toBeVisible();
  });

  test('shows validation errors for missing required DMP answers', async ({ page }) => {
    await page.goto('/dmp/editor');

    await expect(page.getByText('主なファイル形式は必須です。')).toBeVisible();
    await expect(page.getByText('保持期間は必須です。')).toBeVisible();
    await expect(page.getByRole('link', { name: '主なファイル形式は必須です。' })).toHaveAttribute(
      'href',
      '#data_description.data_formats',
    );
  });

  test('keeps DMP editor values after saving a section', async ({ page }) => {
    await page.goto('/dmp/editor');

    const dataFormats = page.getByLabel('主なファイル形式');
    await dataFormats.fill('CSV, JSON, PNG');
    await page.getByRole('button', { name: 'セクションを保存' }).first().click();

    await expect(
      page.getByText('セクションを保存しました。入力内容はこの画面に維持されます。'),
    ).toBeVisible();
    await expect(dataFormats).toHaveValue('CSV, JSON, PNG');

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.reload();
    await expect(page.getByLabel('主なファイル形式')).toHaveValue('CSV, JSON, PNG');
  });

  test('previews filled DMP exports as Markdown', async ({ page }) => {
    await page.goto('/dmp/export');

    await expect(page.getByRole('heading', { name: 'Markdownプレビュー' })).toBeVisible();
    await expect(page.getByText('# 研究データ管理支援ツールの実証研究')).toBeVisible();
    await expect(page.getByText('| 設問 | 回答 | 必須 | 状態 |')).toBeVisible();
  });

  test('provides JSON, CSV, and DOCX export links', async ({ page }) => {
    await page.goto('/dmp/export');

    await expect(page.getByRole('link', { name: 'JSONを保存' })).toHaveAttribute(
      'href',
      '/api/export/json',
    );
    await expect(page.getByRole('link', { name: 'CSVを保存' })).toHaveAttribute(
      'href',
      '/api/export/csv',
    );
    await expect(page.getByRole('link', { name: 'DOCXを保存' })).toHaveAttribute(
      'href',
      '/api/export/docx',
    );
  });
});
