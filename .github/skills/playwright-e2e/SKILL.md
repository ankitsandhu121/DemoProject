---
name: playwright-e2e
description: >-
  Comprehensive JavaScript Playwright end-to-end testing standards for this
  repository, including Page Object Model, fixtures, selector strategy,
  assertions, configuration, debugging, and anti-patterns. Use alongside
  repo-specific skills such as source-grounded-locators.
---

# Playwright E2E Testing

Use this skill whenever writing, reviewing, healing, or debugging Playwright end-to-end tests.

This repository is JavaScript-based. Generate JavaScript files by default:

- specs: `.spec.js`
- page objects: `.page.js`
- fixtures/helpers: `.js`
- Playwright config: `playwright.config.js`

Do not generate TypeScript syntax, type imports, interfaces, or `.ts` files unless the user explicitly asks to migrate the E2E framework to TypeScript.

## Core Principles

1. User-centric testing: write tests from the user's perspective and mirror real user journeys.
2. Resilient selectors: prefer Playwright locators over CSS or XPath.
3. Auto-waiting: rely on Playwright web-first assertions and locator auto-waiting.
4. Isolation: each test must be independent and must not rely on state from previous tests.
5. Readability: tests are documentation and should explain intent clearly.

## Repo Structure

This repository uses acceptance and regression lanes rather than a generic single `tests/` tree.

Use this repo structure:

```text
e2e/
  acceptance/
    specs/
    tests/
  regression/
    specs/
    tests/
  shared/
    fixtures/
    pages/
    utils/
    seed.base.js
```

Use lane-specific test folders:

- acceptance specs: `e2e/acceptance/tests/`
- regression specs: `e2e/regression/tests/`
- shared page objects: `e2e/shared/pages/`
- shared fixtures: `e2e/shared/fixtures/`
- shared test utilities: `e2e/shared/utils/`

Do not create a separate root-level `tests/e2e`, `tests/pages`, or `tests/fixtures` structure for this repo.

## Page Object Model

Always implement the Page Object Model (POM) for generated Playwright tests unless the user explicitly asks for a one-off spike.

Rules:

1. Page objects live under `e2e/shared/pages/`.
2. Specs should not contain long selector/action sequences inline when the behavior belongs to a page or reusable component.
3. Each page object encapsulates selectors and actions for a page or meaningful component.
4. Keep assertions close to user-visible behavior. Page objects may expose expectation helpers when they represent stable page-level outcomes.
5. Use source-grounded locators from `source-grounded-locators` inside page objects.

Base page pattern:

```javascript
class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    await this.page.goto(path);
  }

  async title() {
    return this.page.title();
  }
}

module.exports = {
  BasePage,
};
```

Concrete page pattern:

```javascript
const { expect } = require('@playwright/test');
const { BasePage } = require('./base.page');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectInvalidCredentials() {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText('Invalid email or password');
  }
}

module.exports = {
  LoginPage,
};
```

Spec pattern using POM:

```javascript
const { expect, test } = require('@playwright/test');
const { LoginPage } = require('../../shared/pages/login.page');

test.describe('Login functionality', () => {
  test('TC-SCRUM-2-001 logs in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto('/');
    await loginPage.login('demo@taskflow.dev', 'demo1234');

    await expect(page.getByTestId('dashboard')).toBeVisible();
  });
});
```

## Selector Strategy

Use selector priority from `source-grounded-locators` when React source exists in this repo. That means stable `data-testid` values found in source usually win.

General selector priority:

1. `getByTestId()` when source-grounded stable test ids exist.
2. `getByRole()` with accessible name.
3. `getByLabel()` for labeled inputs.
4. `getByPlaceholder()` only when there is no label and no stable test id.
5. `getByText()` for user-visible non-interactive text.
6. CSS or XPath only as a documented last resort.

Never silently use `.nth()` to work around duplicate test ids. Flag duplicate test ids for the developer.

When an element has no stable `data-testid` in the dev source, do not add one to the app — follow the fallback in `source-grounded-locators`: discover the locator from the live DOM with the Playwright CLI (`playwright-cli` skill), apply the priority order above, and leave a TODO for the missing test id. Never edit `apps/web/**` or `apps/api/**` to create a locator.

## Assertions

Use Playwright web-first assertions that auto-retry.

Examples:

```javascript
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toHaveText('Expected text');
await expect(locator).toContainText('partial');
await expect(locator).toHaveText(/regex pattern/);
await expect(locator).toHaveValue('expected value');
await expect(locator).toBeChecked();
await expect(locator).toBeDisabled();
await expect(page).toHaveURL('/expected-path');
await expect(page).toHaveURL(/\/users\/\d+/);
await expect(page).toHaveTitle('Page Title');
await expect(page.getByRole('listitem')).toHaveCount(5);
await expect(locator).toHaveClass(/active/);
```

Use screenshot assertions only when visual behavior is the actual requirement:

```javascript
await expect(page).toHaveScreenshot('homepage.png');
await expect(locator).toHaveScreenshot('button-hover.png');
```

## Fixtures

Use custom fixtures to share setup logic, page objects, and authenticated state.

Fixture pattern:

```javascript
const base = require('@playwright/test');
const { DashboardPage } = require('../pages/dashboard.page');
const { LoginPage } = require('../pages/login.page');

const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

module.exports = {
  expect: base.expect,
  test,
};
```

Auth state pattern:

```javascript
const { expect, test: setup } = require('@playwright/test');
const { demoUser } = require('../shared/fixtures/auth');
const { LoginPage } = require('../shared/pages/login.page');

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto('/');
  await loginPage.login(demoUser.email, demoUser.password);
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Prefer direct API seeding for setup that is not the behavior under test. Use UI interactions only when the UI behavior itself is under test.

## Configuration Best Practices

Playwright config should use:

1. `baseURL` from environment variables.
2. `trace` retained on failure or retry.
3. screenshots/video on failure when useful.
4. CI-safe `forbidOnly`.
5. retries only for durable regression lanes, not in-sprint acceptance.
6. explicit test directories per lane.

Acceptance lane:

```javascript
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: process.env.ACCEPTANCE_BASE_URL || 'http://localhost:3000',
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: 0,
});
```

Regression lane:

```javascript
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  use: {
    baseURL: process.env.QA_BASE_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: 2,
});
```

## Common Scenario Patterns

Navigation:

```javascript
await page.goto('/');
await expect(page).toHaveURL('/');
```

Forms:

```javascript
await page.getByTestId('login-email-input').fill('demo@taskflow.dev');
await page.getByTestId('login-password-input').fill('demo1234');
await page.getByTestId('login-submit-button').click();
```

Dialogs:

```javascript
page.on('dialog', async (dialog) => {
  await dialog.accept();
});
```

File upload:

```javascript
await page.getByLabel('Upload document').setInputFiles('test-data/sample.pdf');
```

Iframes:

```javascript
const iframe = page.frameLocator('#payment-iframe');
await iframe.getByLabel('Card number').fill('4111111111111111');
```

Network mocking:

```javascript
await page.route('**/api/products', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Mocked Product', price: 9.99 }]),
  });
});
```

Waiting for API response:

```javascript
const responsePromise = page.waitForResponse('**/api/tasks');
await page.getByTestId('add-task-submit').click();
const response = await responsePromise;
expect(response.status()).toBe(200);
```

Dropdowns:

```javascript
await page.getByLabel('Country').selectOption('US');
await page.getByRole('combobox', { name: 'Country' }).click();
await page.getByRole('option', { name: 'United States' }).click();
```

## Best Practices

1. Never use `page.waitForTimeout()`.
2. Always use `test.describe` blocks to group related tests.
3. Use `test.beforeEach` for common setup, but keep it minimal.
4. Tag tests for selective execution, such as `@smoke`, `@critical`, or `@jira-SCRUM-2`.
5. Use soft assertions only for non-blocking checks.
6. Parameterize repeated validation scenarios with arrays.
7. Set reasonable timeouts in config instead of individual tests.
8. Use trace viewer for debugging.
9. Parallelize wisely and preserve test isolation.
10. Clean up test data in fixtures, API reset helpers, or `afterEach`.

Parameterized test pattern:

```javascript
const invalidInputs = [
  { title: '', reason: 'empty title' },
  { title: '   ', reason: 'whitespace title' },
];

for (const { title, reason } of invalidInputs) {
  test(`rejects invalid task title: ${reason}`, async ({ page }) => {
    // test body
  });
}
```

## Anti-Patterns To Avoid

Avoid:

1. hardcoded waits such as `await page.waitForTimeout(3000)`.
2. shared mutable state between tests.
3. testing implementation details instead of user-visible behavior.
4. brittle DOM-structure selectors.
5. giant test files that cover many unrelated features.
6. tests that depend on execution order.
7. absolute URLs in `page.goto()` when `baseURL` is configured.
8. ambiguous assertions without context.
9. testing third-party services directly.
10. leaving data, files, or browser state dirty after a test.

## Debugging

Use:

```bash
npx playwright test --config=e2e/acceptance/playwright.config.js
npx playwright test --config=e2e/regression/playwright.config.js
npx playwright test --ui
npx playwright test --headed
npx playwright show-trace test-results/trace.zip
```

For live browser validation in this workflow, use the `playwright-cli` skill rather than Playwright MCP browser tools.

During local debugging, `test.only` and `page.pause()` are acceptable temporarily, but remove them before committing or finishing generated tests.
