import { expect, test } from '@playwright/test';

test.describe('Phase 3 workflows', () => {
  test('adds templates and creates a DMP form from a registered template', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: 'DMPテンプレート', exact: true })).toBeVisible();
    await expect(page.getByText('generic-jp-v2')).toBeVisible();
    await expect(page.getByText('既定')).toBeVisible();

    await page.goto('/dmp/editor');
    await expect(page.getByRole('heading', { name: 'DMP入力フォーム' })).toBeVisible();
    await expect(page.getByText('研究データ管理支援ツールの実証研究', { exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'DMPセクション' })).toBeVisible();
  });

  test('migrates a DMP to a newer template through a sample endpoint', async ({ request }) => {
    const response = await request.get('/api/templates/migration/sample');
    expect(response.ok()).toBe(true);
    const body = await response.json();

    expect(body.data.fromTemplateId).toBe('generic-jp-v1');
    expect(body.data.toTemplateId).toBe('generic-jp-v2');
    expect(body.data.migratedAnswers['storage_and_sharing.storage_locations']).toEqual(['大学提供クラウド']);
    expect(body.data.unmappedSourceFieldIds).toContain('legacy.field');
  });

  test('exports a dataset as DataCite-like JSON', async ({ request }) => {
    const response = await request.get('/api/repository-exports/datacite_json');
    expect(response.ok()).toBe(true);
    const body = await response.json();

    expect(body.schema).toContain('DataCite');
    expect(body.titles[0].title).toBeTruthy();
    expect(body.creators.length).toBeGreaterThan(0);
    expect(body.fundingReferences.length).toBeGreaterThan(0);
  });

  test('registers a GitHub repository URL as a software output', async ({ page }) => {
    await page.goto('/code-repositories');

    await expect(page.getByRole('heading', { name: 'GitHub/GitLab連携' })).toBeVisible();
    await expect(page.locator('a[href="https://github.com/chinahamu/rdmate-jp"]')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'dataset-analysis-code' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^再現性チェック:/ })).toBeVisible();
  });
});
