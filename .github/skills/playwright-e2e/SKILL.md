---
name: playwright-e2e
description: >-
  General Playwright end-to-end testing guidance for this repository,
  including spec structure, selector strategy, fixtures, and debugging
  patterns. Use alongside repo-specific skills such as source-grounded-locators.
---

# Playwright E2E

Use this skill when writing, reviewing, or debugging Playwright tests in this repository.

## Core Principles

1. Write tests from the user's perspective and model real user journeys.
2. Prefer resilient selectors and Playwright's auto-waiting behavior.
3. Keep each test isolated and readable.
4. Avoid explicit sleeps such as `waitForTimeout`.

## Repo Fit

This repo uses a lane-based E2E structure instead of a generic single `tests/` tree:

- `e2e/acceptance/tests/` for in-sprint story coverage
- `e2e/regression/tests/` for durable QA coverage
- `e2e/shared/fixtures/` for shared setup helpers
- `e2e/shared/seed.base.ts` for common seeding logic

Follow the repo structure above instead of inventing a separate Playwright layout.

## Selector Priority

Choose selectors in this order unless `source-grounded-locators` gives a stronger repo-specific rule:

1. `getByRole`
2. `getByLabel`
3. `getByPlaceholder`
4. `getByText`
5. `getByTestId`
6. CSS or XPath only as a documented last resort

When this repo's React source already exposes stable `data-testid` values for the feature under test, defer to `source-grounded-locators` and use those grounded test ids.

## Test Structure

1. Group related scenarios with `test.describe`.
2. Keep `beforeEach` minimal and focused on repeated setup.
3. Use shared helpers or fixtures for auth and test data setup.
4. Use relative paths with the configured Playwright `baseURL`.
5. Prefer web-first assertions such as `toBeVisible`, `toHaveText`, and `toHaveURL`.

## State and Setup

1. Prefer direct API seeding for setup that is not the behavior under test.
2. Reuse shared helpers from `e2e/shared/` before adding new setup utilities.
3. Keep tests independent and safe for parallel execution where the lane config allows it.

## Anti-Patterns

Avoid:

- `page.waitForTimeout(...)`
- brittle DOM-structure selectors
- giant multi-feature spec files
- assertions against implementation details instead of user-visible behavior
- hidden dependencies between tests

## Debugging

Use:

- `npx playwright test --config=e2e/acceptance/playwright.config.ts`
- `npx playwright test --config=e2e/regression/playwright.config.ts`
- `npx playwright test --ui`
- `npx playwright show-trace <trace-file>`

For live browser validation in this workflow, use the Playwright CLI skill rather than Playwright MCP browser tools.
