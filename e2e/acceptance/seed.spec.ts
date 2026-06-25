import { test } from '@playwright/test';
import { resetTestData } from '../shared/seed.base';

test('reset acceptance test data', async () => {
  await resetTestData(process.env.ACCEPTANCE_API_URL);
});
