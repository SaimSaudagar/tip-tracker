import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: they click through the web build of the app in Chromium, using the
 * same screens, database code and calculations as the phone apps. Run `npm run test:e2e`
 * (the first time, `npx playwright install chromium`). The dev server starts by itself,
 * or an already running `npx expo start --web` on port 8081 is reused.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:8081',
    viewport: { width: 430, height: 1100 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 300_000,
    env: { CI: '1', BROWSER: 'none' },
  },
});
