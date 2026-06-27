const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: process.env.QA_BASE_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: 2,
  fullyParallel: true,
  shard: process.env.CI ? JSON.parse(process.env.SHARD || 'null') : undefined,
});
