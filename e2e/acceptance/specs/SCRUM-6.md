# Acceptance Test Plan: SCRUM-6

## Story

- **Story ID:** SCRUM-6
- **Title:** Projects data table — sort, filter, paginate
- **As a:** logged-in TaskFlow user
- **I want to:** sort, filter, and paginate the Projects data table
- **So that:** I can quickly find the project I am looking for within a large list

---

## Sources

| Source type | Detail |
|---|---|
| Jira issue | SCRUM-6 fetched from `sdetdiaries.atlassian.net` via `atlassian-rovo-mcp/getJiraIssue` |
| Comments | 0 comments on the issue |
| Attachments | None on the issue |
| Linked issues / sub-tasks | None (verified via `getJiraIssueRemoteIssueLinks` and JQL sub-task query) |
| GitHub PR | No remote PR link found; diff derived from local source (`apps/web/src/pages/ProjectsPage.jsx`, `apps/api/server.js`) |

---

## Parsed Requirements

### Acceptance Criteria (from Jira description)

| ID | Criterion |
|----|-----------|
| AC-1 | The Projects page (`/projects`) shows a table of projects with columns Name, Owner, Status, Updated. |
| AC-2 | Clicking a column header sorts by that column ascending; clicking again toggles to descending (indicator ▲/▼). |
| AC-3 | Typing in the filter box narrows rows to those whose name, owner, or status contains the query (case-insensitive). |
| AC-4 | The table shows at most 3 rows per page with Previous/Next controls and a "Page X of Y" indicator. |
| AC-5 | Previous is disabled on the first page; Next is disabled on the last page. |
| AC-6 | Filtering or sorting resets to page 1. |
| AC-7 | When no rows match the filter, an empty-state message is shown. |

### Business Rules (from `apps/api/server.js` and `apps/web/src/pages/ProjectsPage.jsx`)

- `GET /api/projects` returns the in-memory projects array; requires `Authorization: Bearer demo-token`.
- Seed data (7 projects): Apollo, Gemini, Mercury, Voyager, Atlas, Orion, Pioneer with varying owners (Ada Lovelace, Grace Hopper, Alan Turing, Katherine Johnson) and statuses (active, paused, archived).
- `PAGE_SIZE = 3` — enforced in the UI; the API returns all rows.
- Columns: `name`, `owner`, `status`, `updated`. Sort is client-side using `String.localeCompare`.
- Filter matches name, owner, or status (any of the three) case-insensitively (`toLowerCase().includes(query)`).
- Filtering or sorting resets the page counter to 1 (`setPage(1)` in both `toggleSort` and the filter `onChange`).
- `totalPages = Math.max(1, Math.ceil(filteredLength / PAGE_SIZE))`.
- Sort column headers have no `data-testid` (intentional per source comment); use role/text fallback locators.
- `POST /api/reset` resets all stores; call before each test for isolation.

### Implicit Requirements

- The page is reachable at `/projects` via the NavBar link (testid driven from `link.testid` in `NavBar.jsx`).
- Authentication is required; navigation to `/projects` without a token must redirect to login.
- The "New project" button (`data-testid="new-project-link"`) must be visible on the page — not under test here but must not break.
- Column sort toggles: first click → ascending (▲), second click → descending (▼), clicking a different column resets that column to ascending.

---

## Locator Map

All locators are grounded in `data-testid` attributes confirmed in `apps/web/src/pages/ProjectsPage.jsx` and shared components, or documented as fallbacks per the `source-grounded-locators` skill.

| Element | Locator | Source | Notes |
|---|---|---|---|
| Projects page container | `getByTestId('projects-page')` | `ProjectsPage.jsx:51` | |
| New project link | `getByTestId('new-project-link')` | `ProjectsPage.jsx:54` | Link to `/projects/new` |
| Filter / search input | `getByTestId('projects-search')` | `ProjectsPage.jsx:60` | `<input>` |
| Projects table | `getByTestId('projects-table')` | `ProjectsPage.jsx:70` | `<table>` |
| Empty state cell | `getByTestId('projects-empty')` | `ProjectsPage.jsx:88` | rendered only when `pageRows.length === 0` |
| Project row (dynamic) | `` getByTestId(`project-row-${id}`) `` | `ProjectsPage.jsx:94` | one `<tr>` per visible row; id from seeded data |
| Project name cell (dynamic) | `` getByTestId(`project-name-${id}`) `` | `ProjectsPage.jsx:95` | |
| Pagination container | `getByTestId('pagination')` | `ProjectsPage.jsx:105` | |
| Previous button | `getByTestId('page-prev')` | `ProjectsPage.jsx:107` | disabled on page 1 |
| Page indicator | `getByTestId('page-indicator')` | `ProjectsPage.jsx:113` | text "Page X of Y" |
| Next button | `getByTestId('page-next')` | `ProjectsPage.jsx:117` | disabled on last page |
| Sort header — Name (fallback) | `getByRole('columnheader', { name: /Name/ })` or `page.getByTestId('projects-table').getByRole('button', { name: /Name/ })` | `ProjectsPage.jsx:74` | no `data-testid` — TODO for developer |
| Sort header — Owner (fallback) | `getByTestId('projects-table').getByRole('button', { name: /Owner/ })` | `ProjectsPage.jsx:74` | no `data-testid` — TODO for developer |
| Sort header — Status (fallback) | `getByTestId('projects-table').getByRole('button', { name: /Status/ })` | `ProjectsPage.jsx:74` | no `data-testid` — TODO for developer |
| Sort header — Updated (fallback) | `getByTestId('projects-table').getByRole('button', { name: /Updated/ })` | `ProjectsPage.jsx:74` | no `data-testid` — TODO for developer |
| Login email input | `getByTestId('login-email-input')` | `LoginForm.jsx:34` | used in auth preconditions |
| Login password input | `getByTestId('login-password-input')` | `LoginForm.jsx:43` | used in auth preconditions |
| Login submit | `getByTestId('login-submit-button')` | `LoginForm.jsx:54` | used in auth preconditions |

**TODO (developer):** The four column sort `<button>` elements inside `<thead>` have no `data-testid` (see `ProjectsPage.jsx:74` comment). Add `data-testid="sort-name"`, `data-testid="sort-owner"`, `data-testid="sort-status"`, `data-testid="sort-updated"` to each sort button to replace the role/text fallback locators above.

---

## Traceability Matrix

| Test Case ID | Acceptance Criterion | Priority | Type | Notes |
|---|---|---|---|---|
| TC-SCRUM6-001 | AC-1 | P0 | Positive | Table renders with all 4 columns and seeded rows |
| TC-SCRUM6-002 | AC-4 | P0 | Positive | First page shows exactly 3 rows; page indicator is "Page 1 of 3" |
| TC-SCRUM6-003 | AC-5 | P0 | Positive | Previous disabled on page 1; Next enabled |
| TC-SCRUM6-004 | AC-5 | P0 | Positive | Next disabled on last page; Previous enabled |
| TC-SCRUM6-005 | AC-4 | P1 | Positive | Next navigates to page 2; rows change |
| TC-SCRUM6-006 | AC-4 | P1 | Positive | Previous navigates back to page 1 |
| TC-SCRUM6-007 | AC-2 | P0 | Positive | Click Name header — rows sorted ascending (▲) |
| TC-SCRUM6-008 | AC-2 | P0 | Positive | Click Name header again — rows sorted descending (▼) |
| TC-SCRUM6-009 | AC-2 | P1 | Positive | Click different column (Owner) — sorts ascending by owner, indicator moves |
| TC-SCRUM6-010 | AC-2 | P2 | Equivalence | All four column headers produce a sort; each shows ▲ on first click |
| TC-SCRUM6-011 | AC-6 | P0 | Positive | Sorting resets page to 1 |
| TC-SCRUM6-012 | AC-3 | P0 | Positive | Filter by name — only matching rows shown |
| TC-SCRUM6-013 | AC-3 | P1 | Positive | Filter by owner — rows filtered by owner value |
| TC-SCRUM6-014 | AC-3 | P1 | Positive | Filter by status — rows filtered by status value |
| TC-SCRUM6-015 | AC-3 | P1 | Equivalence | Filter is case-insensitive |
| TC-SCRUM6-016 | AC-6 | P0 | Positive | Filtering resets page to 1 |
| TC-SCRUM6-017 | AC-7 | P0 | Positive | Filter with no match shows empty-state message |
| TC-SCRUM6-018 | AC-3 | P1 | Boundary | Filter cleared — all rows and pagination restored |
| TC-SCRUM6-019 | AC-3 | P2 | Boundary | Filter matches exactly 1 row; page indicator is "Page 1 of 1"; prev and next both disabled |
| TC-SCRUM6-020 | Implicit: Auth | P0 | Authorization | Unauthenticated GET /api/projects returns 401 |

---

## Test Cases

### TC-SCRUM6-001: Projects table renders with all four columns and seeded rows visible

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-1
- **Given:** The user is logged in; `POST /api/reset` has been called to restore the 7-project seed
- **When:** The user navigates to `/projects`
- **Then:** `[data-testid="projects-page"]` is visible; `[data-testid="projects-table"]` is visible; the table contains `<th>` text "Name", "Owner", "Status", "Updated"; at least one project row is present in the `<tbody>`
- **Data:** 7 seeded projects (Apollo, Gemini, Mercury, Voyager, Atlas, Orion, Pioneer)
- **Locators:**
  - Page container: `getByTestId('projects-page')`
  - Table: `getByTestId('projects-table')`
  - Column headers: `getByRole('columnheader', { name: /Name/ })` etc. (fallback — no `data-testid`)

---

### TC-SCRUM6-002: First page shows exactly 3 rows and page indicator is "Page 1 of 3"

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-4
- **Given:** The user is logged in and the seed contains 7 projects; no filter is applied; sort is default (name asc)
- **When:** The user navigates to `/projects`
- **Then:** The `<tbody>` has exactly 3 `<tr>` rows visible; `[data-testid="page-indicator"]` contains the text "Page 1 of 3"
- **Data:** 7 projects, PAGE_SIZE = 3 → 3 pages (3 + 3 + 1)
- **Locators:**
  - Table body rows: `getByTestId('projects-table').locator('tbody tr')`
  - Page indicator: `getByTestId('page-indicator')`

---

### TC-SCRUM6-003: Previous button is disabled on page 1; Next button is enabled

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-5
- **Given:** The user is on `/projects` on page 1 with 7 seeded projects
- **When:** The page loads (default state)
- **Then:** `[data-testid="page-prev"]` has the `disabled` attribute; `[data-testid="page-next"]` does not have the `disabled` attribute
- **Locators:**
  - Previous button: `getByTestId('page-prev')`
  - Next button: `getByTestId('page-next')`

---

### TC-SCRUM6-004: Next button is disabled on the last page; Previous button is enabled

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-5
- **Given:** The user is on `/projects` and navigates to page 3 (last page, 1 row) with 7 seeded projects
- **When:** The user clicks Next twice to reach page 3
- **Then:** `[data-testid="page-next"]` has the `disabled` attribute; `[data-testid="page-prev"]` does not have the `disabled` attribute; `[data-testid="page-indicator"]` shows "Page 3 of 3"
- **Locators:**
  - Next button: `getByTestId('page-next')`
  - Previous button: `getByTestId('page-prev')`
  - Page indicator: `getByTestId('page-indicator')`

---

### TC-SCRUM6-005: Clicking Next navigates to page 2 with a different set of rows

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-4
- **Given:** The user is on `/projects` page 1
- **When:** The user clicks `[data-testid="page-next"]`
- **Then:** `[data-testid="page-indicator"]` shows "Page 2 of 3"; the `<tbody>` shows 3 rows that are different from those on page 1
- **Data:** Default sort (name asc): page 1 = Apollo, Atlas, Gemini; page 2 = Mercury, Orion, Pioneer
- **Locators:**
  - Next button: `getByTestId('page-next')`
  - Page indicator: `getByTestId('page-indicator')`
  - Table rows: `getByTestId('projects-table').locator('tbody tr')`

---

### TC-SCRUM6-006: Clicking Previous navigates back to page 1

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-4
- **Given:** The user has navigated to page 2 on `/projects`
- **When:** The user clicks `[data-testid="page-prev"]`
- **Then:** `[data-testid="page-indicator"]` shows "Page 1 of 3"; the rows on page 1 are the same as in TC-SCRUM6-005
- **Locators:**
  - Previous button: `getByTestId('page-prev')`
  - Page indicator: `getByTestId('page-indicator')`

---

### TC-SCRUM6-007: Clicking the Name column header sorts rows ascending (▲ indicator)

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-2
- **Given:** The user is on `/projects` with the default sort state
- **When:** The user clicks the "Name" sort button in the table header
- **Then:** The Name column header button text contains "▲"; the first visible row is the project whose name is alphabetically first (Apollo with seed data)
- **Data:** Seed data sorted asc by name: Apollo, Atlas, Gemini, Mercury, Orion, Pioneer, Voyager
- **Locators:**
  - Name sort button (fallback): `getByTestId('projects-table').getByRole('button', { name: /Name/ })` — TODO: add `data-testid="sort-name"`
  - First row name cell: `getByTestId('project-name-1')` (Apollo has id=1 in seed)

---

### TC-SCRUM6-008: Clicking Name header a second time toggles sort to descending (▼ indicator)

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-2
- **Given:** The user has clicked the Name column header once (ascending sort active)
- **When:** The user clicks the Name sort button again
- **Then:** The Name column header button text contains "▼"; the first visible row is the project whose name is last alphabetically (Voyager with seed data)
- **Data:** Seed data sorted desc by name: Voyager, Pioneer, Orion, Mercury, Gemini, Atlas, Apollo
- **Locators:**
  - Name sort button (fallback): `getByTestId('projects-table').getByRole('button', { name: /Name/ })` — TODO: add `data-testid="sort-name"`
  - First row: `getByTestId('project-row-4')` (Voyager has id=4 in seed)

---

### TC-SCRUM6-009: Clicking a different column (Owner) sorts ascending by that column; indicator moves

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-2
- **Given:** The user is on `/projects`; Name column is currently sorted
- **When:** The user clicks the "Owner" sort button
- **Then:** The Owner column button text contains "▲"; the Name column button no longer shows ▲ or ▼; rows are ordered by owner alphabetically ascending
- **Data:** Owners sorted asc: Ada Lovelace (×2), Alan Turing (×2), Grace Hopper (×2), Katherine Johnson (×1)
- **Locators:**
  - Owner sort button (fallback): `getByTestId('projects-table').getByRole('button', { name: /Owner/ })` — TODO: add `data-testid="sort-owner"`
  - Name sort button (fallback): `getByTestId('projects-table').getByRole('button', { name: /Name/ })` — TODO: add `data-testid="sort-name"`

---

### TC-SCRUM6-010: All four column sort buttons produce a sort; each shows ▲ on first click

- **Priority:** P2
- **Type:** Equivalence
- **Source:** AC-2
- **Given:** The user is on `/projects`
- **When:** The user clicks each of the four column headers in turn: Name, Owner, Status, Updated
- **Then:** Each click applies a sort; the clicked column's button text contains "▲"
- **Data:** Four columns: name, owner, status, updated
- **Locators (fallbacks — all missing data-testid):**
  - Name: `getByTestId('projects-table').getByRole('button', { name: /Name/ })`
  - Owner: `getByTestId('projects-table').getByRole('button', { name: /Owner/ })`
  - Status: `getByTestId('projects-table').getByRole('button', { name: /Status/ })`
  - Updated: `getByTestId('projects-table').getByRole('button', { name: /Updated/ })`
- **Notes:** Implement as a parameterised loop over the four column names. TODO: add `data-testid="sort-{key}"` to each header button.

---

### TC-SCRUM6-011: Sorting resets the current page to 1

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-6
- **Given:** The user is on `/projects` page 2 (navigated there via Next)
- **When:** The user clicks the "Owner" sort button
- **Then:** `[data-testid="page-indicator"]` shows "Page 1 of …"; `[data-testid="page-prev"]` is disabled
- **Locators:**
  - Owner sort button (fallback): `getByTestId('projects-table').getByRole('button', { name: /Owner/ })`
  - Page indicator: `getByTestId('page-indicator')`
  - Previous button: `getByTestId('page-prev')`

---

### TC-SCRUM6-012: Filtering by name shows only matching rows

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-3
- **Given:** The user is on `/projects` with 7 seeded projects
- **When:** The user types "apollo" into `[data-testid="projects-search"]`
- **Then:** Exactly 1 row is visible; that row contains the text "Apollo" in the name cell; `[data-testid="page-indicator"]` shows "Page 1 of 1"
- **Data:** Filter query = "apollo" (lowercase); matches project name "Apollo"
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Table rows: `getByTestId('projects-table').locator('tbody tr')`
  - Page indicator: `getByTestId('page-indicator')`
  - Matching name cell: `getByTestId('project-name-1')`

---

### TC-SCRUM6-013: Filtering by owner value shows only rows with that owner

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-3
- **Given:** The user is on `/projects` with 7 seeded projects
- **When:** The user types "ada" into `[data-testid="projects-search"]`
- **Then:** Exactly 2 rows are visible (Apollo and Atlas, both owned by Ada Lovelace)
- **Data:** Filter query = "ada"; matches owner "Ada Lovelace" (2 projects: Apollo id=1, Atlas id=5)
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Table rows: `getByTestId('projects-table').locator('tbody tr')`

---

### TC-SCRUM6-014: Filtering by status value shows only rows with that status

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-3
- **Given:** The user is on `/projects` with 7 seeded projects
- **When:** The user types "archived" into `[data-testid="projects-search"]`
- **Then:** Exactly 1 row is visible (Voyager, status = archived)
- **Data:** Filter query = "archived"; matches 1 project: Voyager (id=4)
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Table rows: `getByTestId('projects-table').locator('tbody tr')`
  - Name cell: `getByTestId('project-name-4')`

---

### TC-SCRUM6-015: Filter is case-insensitive

- **Priority:** P1
- **Type:** Equivalence
- **Source:** AC-3
- **Given:** The user is on `/projects` with 7 seeded projects
- **When:** The user types "APOLLO" (all caps) into `[data-testid="projects-search"]`
- **Then:** The row for "Apollo" is still shown (exactly 1 row); no empty-state is shown
- **Data:** Filter query = "APOLLO"; implementation lowercases both query and values
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Table rows: `getByTestId('projects-table').locator('tbody tr')`

---

### TC-SCRUM6-016: Filtering resets the current page to 1

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-6
- **Given:** The user is on `/projects` page 2 (navigated there via Next)
- **When:** The user types any character into `[data-testid="projects-search"]`
- **Then:** `[data-testid="page-indicator"]` shows "Page 1 of …"; `[data-testid="page-prev"]` is disabled
- **Data:** Type "a" to trigger a filter that still returns multiple results
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Page indicator: `getByTestId('page-indicator')`
  - Previous button: `getByTestId('page-prev')`

---

### TC-SCRUM6-017: No matching filter query shows the empty-state message

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-7
- **Given:** The user is on `/projects` with 7 seeded projects
- **When:** The user types "zzznomatch" into `[data-testid="projects-search"]`
- **Then:** `[data-testid="projects-empty"]` is visible and contains text "No projects match your filter."; no `<tr>` data rows are visible
- **Data:** Filter query = "zzznomatch" (no match)
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Empty state: `getByTestId('projects-empty')`

---

### TC-SCRUM6-018: Clearing the filter restores all rows and pagination

- **Priority:** P1
- **Type:** Boundary
- **Source:** AC-3
- **Given:** The user has filtered to "apollo" (1 result) on `/projects`
- **When:** The user clears `[data-testid="projects-search"]` (sets value to "")
- **Then:** The table shows 3 rows again (page 1 of 3); `[data-testid="page-indicator"]` shows "Page 1 of 3"; `[data-testid="projects-empty"]` is not present
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Table rows: `getByTestId('projects-table').locator('tbody tr')`
  - Page indicator: `getByTestId('page-indicator')`
  - Empty state (assert absent): `getByTestId('projects-empty')`

---

### TC-SCRUM6-019: Filter matching exactly 1 row — page indicator is "Page 1 of 1"; both pagination buttons disabled

- **Priority:** P2
- **Type:** Boundary
- **Source:** AC-3, AC-5
- **Given:** The user is on `/projects` with 7 seeded projects
- **When:** The user types "voyager" into `[data-testid="projects-search"]` (1 unique match)
- **Then:** 1 row is visible; `[data-testid="page-indicator"]` shows "Page 1 of 1"; both `[data-testid="page-prev"]` and `[data-testid="page-next"]` have the `disabled` attribute
- **Data:** Filter query = "voyager"; 1 match → 1 page → both buttons disabled
- **Locators:**
  - Search input: `getByTestId('projects-search')`
  - Page indicator: `getByTestId('page-indicator')`
  - Previous button: `getByTestId('page-prev')`
  - Next button: `getByTestId('page-next')`

---

### TC-SCRUM6-020: Unauthenticated GET /api/projects returns 401

- **Priority:** P0
- **Type:** Authorization
- **Source:** Implicit — `requireAuth` middleware in `apps/api/server.js:110`
- **Given:** No Authorization header is provided
- **When:** A direct `GET http://localhost:4000/api/projects` request is made via Playwright `request` fixture
- **Then:** Response status is `401`; body JSON contains `{ "error": "Unauthorized" }`
- **Locators:** API-only test — no UI locators
- **Notes:** Implement as a `request` context test, not a browser test.

---

## Developer TODOs

1. **Sort column header buttons (`ProjectsPage.jsx:74`) have no `data-testid`.**
   The source comment confirms this is intentional to force role/text fallback locators, but testability would improve by adding:
   - `data-testid="sort-name"` on the Name `<button>`
   - `data-testid="sort-owner"` on the Owner `<button>`
   - `data-testid="sort-status"` on the Status `<button>`
   - `data-testid="sort-updated"` on the Updated `<button>`
   Until then, use `getByTestId('projects-table').getByRole('button', { name: /Name ▲|Name ▼|Name/ })` as the fallback — the regex covers the label both with and without the sort indicator suffix.
