const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  timeout: 10000,
  expect: { timeout: 3000 },
  // The acceptance lane runs against a single shared in-memory API (apps/api)
  // whose `POST /api/reset` mutates global state. Parallel workers would let one
  // spec's reset wipe another spec's seeded data mid-test, causing cross-file
  // flakiness. Pin to one worker so each spec owns the backend while it runs.
  // (Durable alternative: per-worker server instances or namespaced test data —
  // see the scalability note for this suite.)
  workers: 1,
  fullyParallel: false,
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
