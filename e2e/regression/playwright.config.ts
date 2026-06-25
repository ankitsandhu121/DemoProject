import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.QA_BASE_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
  },
  retries: 2,
  fullyParallel: true,
  shard: process.env.CI ? JSON.parse(process.env.SHARD || 'null') : undefined,
});
