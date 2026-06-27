const { test } = require('@playwright/test');
const { resetTestData } = require('../shared/seed.base');

test('reset acceptance test data', async () => {
  await resetTestData(process.env.ACCEPTANCE_API_URL);
});
