import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.ACCEPTANCE_BASE_URL || 'http://localhost:3000',
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
  },
  retries: 0,
});
