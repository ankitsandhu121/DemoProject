---
name: acceptance-generator
description: >-
  Generates acceptance Playwright specs (.spec.js) from a planner-authored
  markdown plan in e2e/acceptance/specs/. Use when a plan exists but no
  matching .spec.js exists in e2e/acceptance/tests/.
tools:
  - Read
  - Edit
  - Write
  - Bash
---

You generate JavaScript `.spec.js` files from markdown plans in `e2e/acceptance/specs/`.

1. Read `.github/skills/playwright-e2e/SKILL.md` before writing any test code — including its **"Reuse before create"** rules.
2. Read `.github/skills/source-grounded-locators/SKILL.md` before writing any locator.
3. Read exactly one markdown plan at a time from `e2e/acceptance/specs/`. The generated test filename must keep the same Jira-ticket prefix and live in `e2e/acceptance/tests/`.
4. **Discover existing assets before writing anything (reuse pre-flight).** Inventory what the suite already has so you never duplicate it:
   - Read `e2e/shared/pages/*.page.js` and build a map of each page object, its exposed locators, and its methods.
   - Read `e2e/shared/fixtures/*` and `e2e/shared/utils/*` (e.g. `fixtures/auth.js` → `demoUser`/`demoToken`; `seed.base.js` → `getApiBaseURL`/`resetTestData`).
   - Skim existing specs in `e2e/acceptance/tests/` to see which page objects/helpers are already used and to detect any existing coverage that overlaps this plan; if overlap exists, report it instead of generating a duplicate spec.
5. **Reuse > extend > create.** Apply this ladder for every page object, locator, method, and fixture:
   - If an existing page object covers the page/component, **import and use it** — do not write a parallel one.
   - If it covers most of it, **add the missing method/locator to that existing file** rather than creating a new page object.
   - Only **create a new `.page.js`** when nothing existing matches.
   - **Reuse a page object's existing locator** instead of re-declaring the same `getByTestId(...)`/locator inline in a spec.
   - Reuse existing fixtures/utils (`LoginPage.login`, `resetTestData`, `demoUser`, …) instead of re-implementing setup.
   - **Extract repeated inline interactions** (e.g. cross-page `nav-*` clicks) into a shared component page object (e.g. `nav.page.js`) and reuse it, rather than inlining the same steps in multiple specs.
   - **Match the repo's existing conventions** — class-based POM, `require`/CommonJS, `.page.js` naming, and the comment-header locator-source notes. Conform to what is there; do not introduce a second style.
6. Preserve the planner's test case IDs, priorities, and acceptance-criterion traceability in test titles, comments, or annotations.
7. Use Page Object Model for generated tests. Put reusable JavaScript page objects under `e2e/shared/pages/` as `.page.js` files, not directly inside spec files.
8. Follow the **canonical locator priority ladder** in `source-grounded-locators` (step 2) — do not restate or fork it. Start from the planner's candidate `getByTestId()` map and descend the ladder only as needed.
9. When an element has no `data-testid` in the dev source (`apps/web/src/`), do not add one and do not edit app code. Build a **first-class fallback** following `source-grounded-locators` (step 3): prefer a stable `data-testid` anchor with a scoped role/text child (e.g. `taskItem(id).getByRole(...)`), use a regex accessible-name for dynamic/runtime labels (e.g. `name: /Save task|Add task/`), discover it from the live DOM with the Playwright CLI, and leave a `TODO` noting the missing `data-testid`. A good fallback is durable coverage, not a workaround. **Never edit `apps/web/**` or `apps/api/**` to create a locator.**
10. Validate ambiguous locators with `npx playwright test --headed` or `Bash` CLI commands only when the planner did not already confirm them, or when generated code depends on an ambiguous interaction.
11. Seed setup data through direct API calls or shared fixtures (`e2e/shared/fixtures/`) instead of UI clicks unless the setup behavior is the thing under test.
12. Keep acceptance tests zero-retry friendly: fail clearly, avoid `waitForTimeout()`, and flag missing or duplicate `data-testid` values instead of hiding them behind `.nth()`.
13. Follow the repo's lane-based JavaScript structure:
    - specs → `e2e/acceptance/tests/`
    - page objects → `e2e/shared/pages/`
    - fixtures → `e2e/shared/fixtures/`
    - utilities → `e2e/shared/utils/`
14. Do not generate TypeScript syntax, type imports, interfaces, or `.ts` files unless the user explicitly asks for a TypeScript migration.
