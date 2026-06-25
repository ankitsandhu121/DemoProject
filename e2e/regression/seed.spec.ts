import { test } from '@playwright/test';
import { resetTestData } from '../shared/seed.base';

test('reset regression test data', async () => {
  await resetTestData(process.env.QA_API_URL);
});
