---
name: source-grounded-locators
description: >-
  Use before generating or healing any Playwright locator for a feature
  whose React source exists in this repo. Ground locators in actual
  implementation instead of guessing from a live DOM snapshot.
---

# Source-Grounded Locators

Use this skill before generating or healing Playwright locators for TaskFlow UI tests.

## Hard rule — never edit dev source to create locators

**Never edit application/dev source code (`apps/web/**`, `apps/api/**`) to add a `data-testid` or otherwise mint a locator.** Test code under `e2e/**` is the only thing you author. When an element you need has no stable locator in the dev source, you discover one from the live DOM (see the fallback below) and flag the missing `data-testid` as a TODO for the developer — you do not add it yourself.

## Sourcing workflow

1. **Look in the dev folder first.** Grep `apps/web/src/` for `data-testid` before opening a browser session, and build a name-to-testid map from the source:
   ```bash
   grep -rn "data-testid" apps/web/src/
   ```
2. Prefer locators in this order: `getByTestId()` first, then `getByRole()` with an accessible name, then `getByText()`. CSS selectors are a last resort and must be flagged as a TODO instead of accepted silently.
3. **Fallback when no `data-testid` exists in source.** Do NOT invent one and do NOT edit the component. Instead, use the **Playwright CLI** (load the `playwright-cli` skill) to inspect the live DOM, and build a locator that follows the priority order in step 2 (role + accessible name, then text). Record the chosen locator together with a TODO noting the missing `data-testid` so the developer can add a stable id later.
4. Watch for dynamic test ids in template literals, such as `` `task-item-${id}` ``. Match by prefix or regex from known seeded data instead of hardcoding guessed concrete values.
5. Watch for duplicate literal test ids inside `.map()` or other loops. Flag those for the developer rather than disambiguating with `.nth(n)`.
6. For validation or error-state assertions, check the backend validation behavior in `apps/api` instead of guessing error copy from one render.
7. Prefer seeding test data with direct API calls and shared fixtures over UI clicks for setup steps that are not the behavior under test.
