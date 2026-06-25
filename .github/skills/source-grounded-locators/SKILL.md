---
name: source-grounded-locators
description: >-
  Use before generating or healing any Playwright locator for a feature
  whose React source exists in this repo. Ground locators in actual
  implementation instead of guessing from a live DOM snapshot.
---

# Source-Grounded Locators

Use this skill before generating or healing Playwright locators for TaskFlow UI tests.

1. Grep changed component files for `data-testid` before opening a browser session. Build a name-to-testid map from the source.
2. Prefer locators in this order: `getByTestId()` first, then `getByRole()` with an accessible name, then `getByText()`. CSS selectors are a last resort and must be flagged as a TODO instead of accepted silently.
3. Watch for dynamic test ids in template literals, such as `` `task-item-${id}` ``. Match by prefix or regex from known seeded data instead of hardcoding guessed concrete values.
4. Watch for duplicate literal test ids inside `.map()` or other loops. Flag those for the developer rather than disambiguating with `.nth(n)`.
5. For validation or error-state assertions, check the backend validation behavior in `apps/api` instead of guessing error copy from one render.
6. Prefer seeding test data with direct API calls and shared fixtures over UI clicks for setup steps that are not the behavior under test.
