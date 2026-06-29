import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-gui' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: false,
    trace: 'on',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 500,
    },
  },
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-gui',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
});
