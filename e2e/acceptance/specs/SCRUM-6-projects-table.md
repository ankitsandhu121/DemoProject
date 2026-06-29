# Acceptance Test Plan: SCRUM-6

## Sources

- **Jira fetch:** `getJiraIssue` via `atlassian-rovo-mcp` (cloudId `c746fee4-d731-4aad-bcd3-c2cc1ba40464`)
- **Comments:** 0 (none on ticket)
- **Attachments:** 0 (none on ticket)
- **Linked issues / sub-tasks:** none
- **Remote issue links (PR):** none returned by `getJiraIssueRemoteIssueLinks`
- **Source diff fallback:** `apps/web/src/pages/ProjectsPage.jsx` inspected directly (current branch `main`)

---

## Story

- **Story ID:** SCRUM-6
- **Title:** Projects data table: sort, filter, paginate
- **Issue type:** Task
- **Status:** To Do
- **As a:** logged-in TaskFlow user
- **I want:** the Projects page to display a sortable, filterable, paginated table of projects
- **So that:** I can quickly find and navigate through projects without scrolling an unbounded list

---

## Parsed Requirements

### Acceptance Criteria

| ID | Criterion (verbatim from Jira description) |
|----|--------------------------------------------|
| AC-1 | The Projects page (`/projects`) shows a table of projects with columns Name, Owner, Status, Updated. |
| AC-2 | Clicking a column header sorts by that column ascending; clicking again toggles to descending (indicator ▲/▼). |
| AC-3 | Typing in the filter box narrows rows to those whose name, owner, or status contains the query (case-insensitive). |
| AC-4 | The table shows at most 3 rows per page with Previous/Next controls and a "Page X of Y" indicator. |
| AC-5 | Previous is disabled on the first page; Next is disabled on the last page. |
| AC-6 | Filtering or sorting resets to page 1. |
| AC-7 | When no rows match the filter, an empty-state message is shown. |

### Business Rules (derived from source and AC)

- Default seed has 7 projects: Apollo, Gemini, Mercury, Voyager, Atlas, Orion, Pioneer. That yields 3 pages (3 / 3 / 1).
- Default sort is `name asc` (from `useState({ key: 'name', dir: 'asc' })`).
- Filter matches against `name`, `owner`, and `status` fields (not `updated`).
- Filter is case-insensitive (`toLowerCase()` comparison).
- Sort uses `String.localeCompare` — alphabetical for name/owner/status, lexicographic for date strings.
- Page size is constant at 3 (`PAGE_SIZE = 3`).
- `currentPage` is clamped to `Math.min(page, totalPages)` — navigating to page 3 then filtering to 1 result still shows page 1.

### Implicit Requirements

- Auth: the `/projects` route requires a valid token (API returns 401 without `Authorization: Bearer demo-token`).
- Accessibility: sort buttons are `<button>` elements inside `<th>` — keyboard-activatable via Enter/Space.
- No `data-testid` on sort header buttons — fallback locator required (see Locator Notes).
- No `data-testid` on pagination Previous/Next buttons — fallback locator required.

### Comments / Conflicts

None. The ticket has no comments.

### Linked Issues / Sub-tasks

None.

### PR / Diff

No linked PR. Source inspected at `apps/web/src/pages/ProjectsPage.jsx` on current branch.

---

## Locator Map

Built from `grep -rn "data-testid" apps/web/src/pages/ProjectsPage.jsx`:

| Element | Locator | Notes |
|---------|---------|-------|
| Page container | `getByTestId('projects-page')` | Confirmed in source |
| "New project" link | `getByTestId('new-project-link')` | Confirmed in source |
| Filter input | `getByTestId('projects-search')` | Confirmed in source |
| Projects table | `getByTestId('projects-table')` | Confirmed in source |
| Empty-state cell | `getByTestId('projects-empty')` | Confirmed in source |
| Project row (dynamic) | `getByTestId('project-row-{id}')` | Template literal; use seeded IDs (1–7) |
| Project name cell (dynamic) | `getByTestId('project-name-{id}')` | Template literal |
| Pagination wrapper | `getByTestId('pagination')` | Confirmed in source |
| Previous button | `getByTestId('pagination').getByRole('button', { name: 'Previous' })` | No `data-testid` on button — fallback. TODO (developer): add `data-testid="page-prev"` to the Previous button |
| Next button | `getByTestId('pagination').getByRole('button', { name: 'Next' })` | No `data-testid` on button — fallback. TODO (developer): add `data-testid="page-next"` to the Next button |
| Page indicator | `getByTestId('page-indicator')` | Confirmed in source |
| Sort header — Name | `getByTestId('projects-table').getByRole('button', { name: /Name/ })` | No `data-testid` on `<th>` sort buttons. TODO (developer): add `data-testid="sort-name"` etc. |
| Sort header — Owner | `getByTestId('projects-table').getByRole('button', { name: /Owner/ })` | Fallback |
| Sort header — Status | `getByTestId('projects-table').getByRole('button', { name: /Status/ })` | Fallback |
| Sort header — Updated | `getByTestId('projects-table').getByRole('button', { name: /Updated/ })` | Fallback |

---

## Traceability Matrix

| Test Case ID | Acceptance Criterion | Priority | Type | Notes |
|---|---|---|---|---|
| TC-SCRUM6-001 | AC-1 | P0 | Positive | Table renders with all 4 columns and seeded data |
| TC-SCRUM6-002 | AC-1 | P1 | Authorization | Unauthenticated access is blocked |
| TC-SCRUM6-003 | AC-2 | P0 | Positive | Click Name header sorts ascending then descending |
| TC-SCRUM6-004 | AC-2 | P1 | Positive | Click Owner header sorts; sort indicator updates |
| TC-SCRUM6-005 | AC-2 | P1 | Positive | Click Status header sorts |
| TC-SCRUM6-006 | AC-3 | P0 | Positive | Filter by name narrows rows (case-insensitive) |
| TC-SCRUM6-007 | AC-3 | P1 | Positive | Filter by owner narrows rows |
| TC-SCRUM6-008 | AC-3 | P1 | Positive | Filter by status narrows rows |
| TC-SCRUM6-009 | AC-3 | P1 | Equivalence | Filter is case-insensitive |
| TC-SCRUM6-010 | AC-4 | P0 | Positive | Page 1 shows exactly 3 rows; page 2 shows next 3 |
| TC-SCRUM6-011 | AC-4 | P1 | Boundary | Last page shows remaining rows (1 of 7) |
| TC-SCRUM6-012 | AC-5 | P0 | Boundary | Previous disabled on page 1 |
| TC-SCRUM6-013 | AC-5 | P0 | Boundary | Next disabled on last page |
| TC-SCRUM6-014 | AC-6 | P1 | Positive | Filtering resets pagination to page 1 |
| TC-SCRUM6-015 | AC-6 | P1 | Positive | Sorting resets pagination to page 1 |
| TC-SCRUM6-016 | AC-7 | P0 | Negative | Filter with no match shows empty-state message |
| TC-SCRUM6-017 | AC-3 | P2 | Boundary | Clearing filter restores all rows |
| TC-SCRUM6-018 | AC-2 | P2 | Accessibility | Sort headers are keyboard-activatable |

---

## Test Cases

### TC-SCRUM6-001: Projects table renders with all four columns and seeded data

- Priority: P0
- Type: Positive
- Source: AC-1
- Given: the user is logged in and navigates to `/projects`
- When: the page finishes loading
- Then: a table with `data-testid="projects-table"` is visible; the column headers Name, Owner, Status, Updated are all present; at least one seeded project row (e.g. `project-row-1` "Apollo") appears in the table
- Data: seed via `POST /api/reset`; seed projects include Apollo (id=1), Gemini (id=2), Mercury (id=3)
- Locators:
  - `getByTestId('projects-table')`
  - `getByTestId('projects-table').getByRole('button', { name: /Name/ })`
  - `getByTestId('projects-table').getByRole('button', { name: /Owner/ })`
  - `getByTestId('projects-table').getByRole('button', { name: /Status/ })`
  - `getByTestId('projects-table').getByRole('button', { name: /Updated/ })`
  - `getByTestId('project-row-1')`

---

### TC-SCRUM6-002: Unauthenticated user cannot access the Projects page

- Priority: P1
- Type: Authorization
- Source: AC-1 (implicit: requires auth token)
- Given: the user is not logged in (no token in session)
- When: the user navigates directly to `/projects`
- Then: the projects table is not rendered; the user is redirected to the login page or sees an auth error
- Data: no auth token
- Locators:
  - `getByTestId('login-email-input')` (confirms redirect to login)

---

### TC-SCRUM6-003: Clicking the Name column header sorts ascending then toggles to descending

- Priority: P0
- Type: Positive
- Source: AC-2
- Given: the user is logged in and the Projects page is loaded at page 1 (default sort: name asc)
- When: the user clicks the Name sort header
- Then: the sort indicator reads "Name ▲" and the first row is the project that comes first alphabetically (Apollo); clicking Name again toggles the indicator to "▼" and the first visible row is the project that comes last alphabetically (Voyager)
- Data: 7 seeded projects; alphabetically first = Apollo, last = Voyager
- Locators:
  - `getByTestId('projects-table').getByRole('button', { name: /Name/ })` — TODO (developer): add `data-testid="sort-name"`
  - `getByTestId('project-name-1')` (Apollo = id 1)

---

### TC-SCRUM6-004: Clicking the Owner column header sorts rows by owner

- Priority: P1
- Type: Positive
- Source: AC-2
- Given: the user is on the Projects page
- When: the user clicks the Owner sort header
- Then: the sort indicator updates to show Owner ▲; rows are sorted alphabetically by owner (Ada Lovelace first); clicking again reverses to Owner ▼ (rows sorted descending)
- Data: owners in seed: Ada Lovelace, Grace Hopper, Alan Turing, Katherine Johnson
- Locators:
  - `getByTestId('projects-table').getByRole('button', { name: /Owner/ })` — TODO (developer): add `data-testid="sort-owner"`

---

### TC-SCRUM6-005: Clicking the Status column header sorts rows by status

- Priority: P1
- Type: Positive
- Source: AC-2
- Given: the user is on the Projects page
- When: the user clicks the Status sort header
- Then: rows are sorted alphabetically by status (active, archived, paused); the indicator shows Status ▲
- Data: statuses in seed: active, paused, archived
- Locators:
  - `getByTestId('projects-table').getByRole('button', { name: /Status/ })` — TODO (developer): add `data-testid="sort-status"`

---

### TC-SCRUM6-006: Filter by project name narrows the visible rows

- Priority: P0
- Type: Positive
- Source: AC-3
- Given: the user is on the Projects page with 7 seeded projects
- When: the user types "apollo" into the filter input
- Then: only the row for "Apollo" is visible; all other project rows are hidden; the page indicator reflects 1 page
- Data: filter query = "apollo"
- Locators:
  - `getByTestId('projects-search')`
  - `getByTestId('project-row-1')` (Apollo id=1)
  - `getByTestId('page-indicator')` — expected text: "Page 1 of 1"

---

### TC-SCRUM6-007: Filter by owner name narrows rows

- Priority: P1
- Type: Positive
- Source: AC-3
- Given: the user is on the Projects page
- When: the user types "ada" into the filter input
- Then: only projects owned by Ada Lovelace are shown (Apollo id=1, Atlas id=5)
- Data: filter query = "ada"; expected projects: Apollo, Atlas
- Locators:
  - `getByTestId('projects-search')`
  - `getByTestId('project-row-1')`, `getByTestId('project-row-5')`

---

### TC-SCRUM6-008: Filter by status narrows rows

- Priority: P1
- Type: Positive
- Source: AC-3
- Given: the user is on the Projects page
- When: the user types "archived" into the filter input
- Then: only rows whose status is "archived" are shown (Voyager id=4)
- Data: filter query = "archived"; expected: Voyager
- Locators:
  - `getByTestId('projects-search')`
  - `getByTestId('project-row-4')`

---

### TC-SCRUM6-009: Filter is case-insensitive

- Priority: P1
- Type: Equivalence
- Source: AC-3
- Given: the user is on the Projects page
- When: the user types "APOLLO" (all uppercase) into the filter input
- Then: the row for Apollo is visible — same result as lowercase "apollo"
- Data: filter query = "APOLLO"
- Locators:
  - `getByTestId('projects-search')`
  - `getByTestId('project-row-1')`

---

### TC-SCRUM6-010: Page 1 shows exactly 3 rows; advancing to page 2 shows the next 3

- Priority: P0
- Type: Positive
- Source: AC-4
- Given: the user is on the Projects page with 7 seeded projects and no filter applied
- When: the page loads (default sort name asc)
- Then: exactly 3 rows are shown (Apollo, Atlas, Gemini — alphabetically first three); the page indicator reads "Page 1 of 3"
- When: the user clicks Next
- Then: page indicator reads "Page 2 of 3" and the next 3 rows are shown (Mercury, Orion, Pioneer)
- Data: 7 seeded projects sorted by name asc; PAGE_SIZE = 3
- Locators:
  - `getByTestId('page-indicator')`
  - `getByTestId('pagination').getByRole('button', { name: 'Next' })` — TODO (developer): add `data-testid="page-next"`

---

### TC-SCRUM6-011: Last page shows only the remaining row(s)

- Priority: P1
- Type: Boundary
- Source: AC-4
- Given: the user is on the Projects page with 7 seeded projects and no filter
- When: the user navigates to page 3
- Then: page indicator reads "Page 3 of 3" and exactly 1 row is visible (Pioneer)
- Data: 7 projects; PAGE_SIZE = 3; last page = 1 row
- Locators:
  - `getByTestId('pagination').getByRole('button', { name: 'Next' })` — clicked twice
  - `getByTestId('page-indicator')`

---

### TC-SCRUM6-012: Previous button is disabled on page 1

- Priority: P0
- Type: Boundary
- Source: AC-5
- Given: the user is on the Projects page and is on page 1
- When: the page loads
- Then: the Previous button has the `disabled` attribute and cannot be clicked
- Data: default state (page 1)
- Locators:
  - `getByTestId('pagination').getByRole('button', { name: 'Previous' })` — assert `.isDisabled()`. TODO (developer): add `data-testid="page-prev"`

---

### TC-SCRUM6-013: Next button is disabled on the last page

- Priority: P0
- Type: Boundary
- Source: AC-5
- Given: the user has navigated to the last page (page 3 of 3)
- When: the user inspects the Next button
- Then: the Next button has the `disabled` attribute
- Data: navigate to page 3 via two Next clicks
- Locators:
  - `getByTestId('pagination').getByRole('button', { name: 'Next' })` — assert `.isDisabled()`. TODO (developer): add `data-testid="page-next"`

---

### TC-SCRUM6-014: Typing a filter resets pagination to page 1

- Priority: P1
- Type: Positive
- Source: AC-6
- Given: the user has navigated to page 2 of the projects table
- When: the user types "a" into the filter input
- Then: the page indicator immediately resets to "Page 1 of …" and only matching rows are shown
- Data: navigate to page 2 then type "a"
- Locators:
  - `getByTestId('pagination').getByRole('button', { name: 'Next' })`
  - `getByTestId('projects-search')`
  - `getByTestId('page-indicator')` — assert text starts with "Page 1 of"

---

### TC-SCRUM6-015: Clicking a sort header resets pagination to page 1

- Priority: P1
- Type: Positive
- Source: AC-6
- Given: the user has navigated to page 2
- When: the user clicks the Status sort header
- Then: the page indicator resets to "Page 1 of …"
- Data: navigate to page 2; click Status sort
- Locators:
  - `getByTestId('pagination').getByRole('button', { name: 'Next' })`
  - `getByTestId('projects-table').getByRole('button', { name: /Status/ })`
  - `getByTestId('page-indicator')` — assert text starts with "Page 1 of"

---

### TC-SCRUM6-016: Filter with no match shows the empty-state message

- Priority: P0
- Type: Negative
- Source: AC-7
- Given: the user is on the Projects page
- When: the user types "zzz_no_match_xyz" into the filter input
- Then: the table body shows no project rows; the empty-state cell (`data-testid="projects-empty"`) is visible with text "No projects match your filter."
- Data: filter query = "zzz_no_match_xyz"
- Locators:
  - `getByTestId('projects-search')`
  - `getByTestId('projects-empty')`

---

### TC-SCRUM6-017: Clearing the filter restores all rows

- Priority: P2
- Type: Boundary
- Source: AC-3
- Given: the user has typed "apollo" and the filter shows 1 row
- When: the user clears the filter input
- Then: all 7 projects are again visible across 3 pages; the page indicator reads "Page 1 of 3"
- Data: clear filter input (set value to empty string)
- Locators:
  - `getByTestId('projects-search')`
  - `getByTestId('page-indicator')`

---

### TC-SCRUM6-018: Sort headers are keyboard-activatable

- Priority: P2
- Type: Accessibility
- Source: AC-2 (implicit: sort buttons must be keyboard accessible)
- Given: the user is on the Projects page
- When: the user tabs to the "Name" sort button and presses Enter
- Then: the sort activates (indicator appears ▲/▼) identically to a mouse click
- Data: keyboard navigation; no mouse involved
- Locators:
  - `getByTestId('projects-table').getByRole('button', { name: /Name/ })` — `.focus()` then `.press('Enter')`
  - TODO (developer): add `data-testid="sort-name"` to enable simpler targeting

---

## TODOs for Developers

1. **`data-testid="page-prev"`** — add to the Previous `<button>` in `ProjectsPage.jsx` (currently has no test id; comment in source says "sort headers force a role/text fallback").
2. **`data-testid="page-next"`** — add to the Next `<button>` in `ProjectsPage.jsx`.
3. **`data-testid="sort-name"`, `sort-owner"`, `sort-status"`, `sort-updated"`** — add to each `<button>` inside the `<th>` sort headers. Source comment acknowledges these force fallback locators.
