import { request } from '@playwright/test';

const DEFAULT_API_URL = 'http://localhost:4000';

export function getApiBaseURL() {
  return process.env.API_BASE_URL || process.env.ACCEPTANCE_API_URL || DEFAULT_API_URL;
}

export async function resetTestData(apiBaseURL = getApiBaseURL()) {
  const context = await request.newContext({ baseURL: apiBaseURL });
  const response = await context.post('/api/reset');
  await context.dispose();

  if (!response.ok()) {
    throw new Error(`Failed to reset test data: ${response.status()} ${response.statusText()}`);
  }
}
