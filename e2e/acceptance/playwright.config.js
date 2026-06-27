const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  timeout: 10000,
  expect: { timeout: 3000 },
  use: {
    baseURL: process.env.ACCEPTANCE_BASE_URL || 'http://localhost:3000',
    testIdAttribute: 'data-testid',
    actionTimeout: 3000,
    navigationTimeout: 5000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: 0,
});
