const { test } = require('@playwright/test');
const { resetTestData } = require('../shared/seed.base');

test('reset regression test data', async () => {
  await resetTestData(process.env.QA_API_URL);
});
