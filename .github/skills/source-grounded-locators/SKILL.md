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
2. **Canonical locator priority ladder.** This is the single source of truth for selector
   priority; every other skill and agent defers to this list rather than restating its own.
   1. `getByTestId()` — a stable `data-testid` found in source.
   2. `getByRole()` with an accessible name.
   3. `getByLabel()` for labeled form controls.
   4. `getByPlaceholder()` only when there is no label and no test id.
   5. `getByText()` for user-visible non-interactive text.
   6. CSS / XPath — last resort only, and must be flagged as a `TODO` instead of accepted silently.

3. **The fallback strategy is first-class, not a workaround.** When an element has no
   `data-testid` in source, you do NOT invent one and do NOT edit the component — but a
   well-built fallback is a *legitimate, durable* locator, not a temporary hack. Use the
   **Playwright CLI** (load the `playwright-cli` skill) to inspect the live DOM, then build the
   locator with these patterns, in order of preference:

   - **Stable anchor + scoped child (preferred).** Anchor on the nearest element that *does*
     have a `data-testid`, then reach inside it by role or text. This keeps the locator stable
     even when sibling markup changes. Example from `e2e/shared/pages/task.page.js`:
     ```js
     taskItem(id).getByRole('button', { name: /Mark done|Mark active/ }) // scoped to data-testid parent
     taskItem(id).getByText(title)
     ```
   - **Regex accessible-name for dynamic / runtime labels.** When the visible label is fetched
     at runtime (e.g. `GET /api/config`), rendered by a third-party component, or has an error
     fallback, match it with a regex covering every known value instead of a brittle exact string:
     ```js
     page.getByRole('button', { name: /Save task|Add task/ }) // label comes from /api/config
     ```
   - Otherwise fall through the canonical ladder in step 2 (role+name → label → text).

   Always pair the chosen fallback with a `TODO (developer): add data-testid="…"` noting the
   missing id. The TODO is testability hygiene that makes the gap visible — it is **not** an
   apology for a substandard locator.
4. Watch for dynamic test ids in template literals, such as `` `task-item-${id}` ``. Match by prefix or regex from known seeded data instead of hardcoding guessed concrete values.
5. Watch for duplicate literal test ids inside `.map()` or other loops. Flag those for the developer rather than disambiguating with `.nth(n)`.
6. For validation or error-state assertions, check the backend validation behavior in `apps/api` instead of guessing error copy from one render.
7. Prefer seeding test data with direct API calls and shared fixtures over UI clicks for setup steps that are not the behavior under test.
