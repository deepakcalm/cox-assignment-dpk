import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const harnessPort = Number(process.env.HARNESS_PORT ?? 4400);

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false, // each test spins up a live cobrowse session
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Full flow: our page with Glance embedded -> key -> agent joins -> PII masked
      name: 'harness',
      testMatch: /(cobrowse-join|harness-wiring)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${harnessPort}` },
    },
    {
      // Customer side only: click footer CoBrowse on usbank.com and read the 4-digit key
      name: 'usbank-smoke',
      testMatch: /usbank-key\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node harness/server.mjs',
    url: `http://localhost:${harnessPort}/health`,
    reuseExistingServer: !process.env.CI,
  },
});
