# Acceptance Test Plan: SCRUM-5

> **Note on Jira fetch:** The Atlassian MCP server (`atlassian-rovo-mcp`) is configured for this project
> but is not directly invocable via Bash in this environment. The acceptance criteria and story narrative
> below are derived from the app's implemented source code (`apps/web/src/`, `apps/api/server.js`) and
> the TaskFlow project conventions. If SCRUM-5's Jira acceptance criteria differ from what is implemented,
> update this plan to match the authoritative ticket before generating Playwright tests.

---

## Story

- **Story ID:** SCRUM-5
- **Title:** Task Management — Add, Complete, and Delete Tasks
- **As a:** logged-in TaskFlow user
- **I want to:** add new tasks, mark them done or active, and delete them
- **So that:** I can manage my personal to-do list within TaskFlow

---

## Parsed Requirements

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | A logged-in user can add a new task by typing a title and submitting the form; the task appears in the list immediately. |
| AC-2 | Submitting an empty or whitespace-only task title does nothing — no new task is created. |
| AC-3 | A user can mark an incomplete task as done; the task receives a `done` visual state and the toggle button label changes to "Mark active". |
| AC-4 | A user can mark a completed task as active again; the `done` visual state is removed and the toggle button label changes to "Mark done". |
| AC-5 | A user can delete a task; the task is removed from the list immediately. |
| AC-6 | When no tasks exist, the empty-state message "No tasks yet - add one above." is displayed instead of the task list. |
| AC-7 | After a task is added the input field is cleared and ready for the next entry. |

### Business Rules (from source)

- `AddTaskForm` calls `title.trim()` before sending to the API; a blank-or-whitespace title short-circuits with an early return and nothing is sent to the server.
- Task state is managed server-side in memory (`apps/api/server.js`). A `POST /api/reset` endpoint is available for test isolation.
- Auth is token-based (`Bearer demo-token`). All task endpoints require `Authorization` header; unauthenticated requests receive `401 Unauthorized`.
- Toggle (`PATCH /api/tasks/:id`) flips `done` server-side; the entire updated tasks array is returned.
- Delete (`DELETE /api/tasks/:id`) removes the task server-side; the entire updated tasks array is returned.

### Implicit Requirements

- The dashboard (`data-testid="dashboard"`) must be visible only after login.
- Task IDs are dynamic integers (`nextId` counter); locators use dynamic `data-testid` patterns like `` `task-item-${id}` ``.
- No client-side pagination or filtering is implemented; all tasks are rendered in a single flat list.

---

## Locator Map

All locators below are grounded in `data-testid` attributes confirmed present in `apps/web/src/`.

| Element | Locator | Source file | Notes |
|---------|---------|-------------|-------|
| Dashboard container | `getByTestId('dashboard')` | `App.jsx:20` | Only rendered post-login |
| Add-task input | `getByTestId('add-task-input')` | `AddTaskForm.jsx:16` | text input |
| Add-task submit button | `getByTestId('add-task-submit')` | `AddTaskForm.jsx:21` | |
| Empty state message | `getByTestId('task-list-empty')` | `TaskList.jsx:3` | |
| Task list `<ul>` | `getByTestId('task-list')` | `TaskList.jsx:7` | |
| Individual task `<li>` | `getByTestId('task-item-{id}')` | `TaskList.jsx:9` | dynamic; use seeded ID |
| Toggle (complete) button | `getByTestId('task-complete-{id}')` | `TaskList.jsx:11` | dynamic; label changes per state |
| Delete button | `getByTestId('task-delete-{id}')` | `TaskList.jsx:14` | dynamic |
| Task title text | `getByTestId('task-item-{id}').getByText(title)` | `TaskList.jsx:10` | `<span>` has no testid — see TODO below |
| Login email input | `getByTestId('login-email-input')` | `LoginForm.jsx:34` | used in precondition setup |
| Login password input | `getByTestId('login-password-input')` | `LoginForm.jsx:43` | used in precondition setup |
| Login submit button | `getByTestId('login-submit-button')` | `LoginForm.jsx:54` | used in precondition setup |

**TODO (for developer):** The `<span>` inside each `<li>` that renders the task title (`TaskList.jsx:10`) has no `data-testid`. Add `data-testid="task-title-{task.id}"` to enable direct assertion on the task name text without relying on `getByText`.

---

## Traceability Matrix

| Test Case ID | Acceptance Criterion | Priority | Type | Notes |
|---|---|---|---|---|
| TC-SCRUM5-001 | AC-1 | P0 | Positive | Happy path — add a task |
| TC-SCRUM5-002 | AC-7 | P0 | Positive | Input clears after add |
| TC-SCRUM5-003 | AC-2 | P1 | Negative | Empty title — no submission |
| TC-SCRUM5-004 | AC-2 | P1 | Boundary | Whitespace-only title — no submission |
| TC-SCRUM5-005 | AC-3 | P0 | Positive | Mark a task as done |
| TC-SCRUM5-006 | AC-4 | P1 | Positive | Mark a completed task as active |
| TC-SCRUM5-007 | AC-5 | P0 | Positive | Delete a task |
| TC-SCRUM5-008 | AC-6 | P1 | Positive | Empty state shown with no tasks |
| TC-SCRUM5-009 | AC-6 | P1 | Negative | Empty state hidden once a task is added |
| TC-SCRUM5-010 | AC-1 | P1 | Positive | Multiple tasks added appear in list |
| TC-SCRUM5-011 | AC-5 | P1 | Positive | Delete one of multiple tasks; others remain |
| TC-SCRUM5-012 | AC-1 | P2 | Boundary | Task title at 1 character — accepted |
| TC-SCRUM5-013 | AC-1 | P2 | Boundary | Task title with leading/trailing whitespace — trimmed before save |
| TC-SCRUM5-014 | Implicit — Auth | P0 | Authorization | Unauthenticated API call to /api/tasks returns 401 |
| TC-SCRUM5-015 | Implicit — Auth | P0 | Authorization | Dashboard is not rendered before login |

---

## Test Cases

### TC-SCRUM5-001: Add a new task — happy path

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-1
- **Given:** The user is logged in and the dashboard is visible; the task list is empty (reset via `POST /api/reset`)
- **When:** The user types "Buy groceries" into `[data-testid="add-task-input"]` and clicks `[data-testid="add-task-submit"]`
- **Then:** A task item matching the title "Buy groceries" appears in `[data-testid="task-list"]`; the new `<li>` has `data-testid` matching `task-item-{id}`
- **Data:** title = "Buy groceries"
- **Locators:**
  - Input: `getByTestId('add-task-input')`
  - Submit: `getByTestId('add-task-submit')`
  - Task list: `getByTestId('task-list')`
  - Task item: `getByTestId('task-item-1')` (first item after reset)
  - Title text: `getByTestId('task-item-1').getByText('Buy groceries')` — TODO: add `data-testid="task-title-{id}"` to `<span>` in `TaskList.jsx`

---

### TC-SCRUM5-002: Input field clears after task is added

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-7
- **Given:** The user is logged in and on the dashboard
- **When:** The user types "Read a book" into the add-task input and clicks the submit button
- **Then:** The add-task input value is empty (`''`) after the task is created
- **Data:** title = "Read a book"
- **Locators:**
  - Input: `getByTestId('add-task-input')`
  - Submit: `getByTestId('add-task-submit')`

---

### TC-SCRUM5-003: Empty title — form does not submit

- **Priority:** P1
- **Type:** Negative
- **Source:** AC-2
- **Given:** The user is logged in; the add-task input is empty (default state)
- **When:** The user clicks `[data-testid="add-task-submit"]` without typing anything
- **Then:** No new task is added to the list; the task list count does not change; no network request is made to `POST /api/tasks`
- **Data:** title = "" (empty string)
- **Locators:**
  - Submit: `getByTestId('add-task-submit')`
  - Task list (assert absent or unchanged): `getByTestId('task-list-empty')` if 0 tasks, or `getByTestId('task-list')` item count unchanged

---

### TC-SCRUM5-004: Whitespace-only title — form does not submit

- **Priority:** P1
- **Type:** Boundary
- **Source:** AC-2
- **Given:** The user is logged in
- **When:** The user types "   " (spaces only) into the add-task input and clicks submit
- **Then:** No new task is created; the empty-state message remains visible if there were no tasks
- **Data:** title = "   " (3 spaces)
- **Locators:**
  - Input: `getByTestId('add-task-input')`
  - Submit: `getByTestId('add-task-submit')`
  - Empty state: `getByTestId('task-list-empty')`

---

### TC-SCRUM5-005: Mark a task as done

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-3
- **Given:** The user is logged in; there is one task "Walk the dog" in the list with `done = false`; the toggle button shows "Mark done"
- **When:** The user clicks `[data-testid="task-complete-{id}"]`
- **Then:** The `<li>` gains the CSS class `done`; the toggle button label changes to "Mark active"; `PATCH /api/tasks/{id}` was called successfully
- **Data:** Seed task via `POST /api/tasks` with title "Walk the dog"
- **Locators:**
  - Toggle button: `getByTestId('task-complete-1')`
  - Task item (class check): `getByTestId('task-item-1')`

---

### TC-SCRUM5-006: Mark a completed task as active again

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-4
- **Given:** The user is logged in; task "Walk the dog" has `done = true`; the toggle button shows "Mark active"
- **When:** The user clicks `[data-testid="task-complete-{id}"]`
- **Then:** The `done` CSS class is removed from the `<li>`; the toggle button label changes back to "Mark done"
- **Data:** Seed task, then toggle once via API to set `done = true` before the test step
- **Locators:**
  - Toggle button: `getByTestId('task-complete-1')`
  - Task item: `getByTestId('task-item-1')`

---

### TC-SCRUM5-007: Delete a task

- **Priority:** P0
- **Type:** Positive
- **Source:** AC-5
- **Given:** The user is logged in; there is one task "Call dentist" in the list
- **When:** The user clicks `[data-testid="task-delete-{id}"]`
- **Then:** The task `<li>` is removed from the DOM; the empty-state message `[data-testid="task-list-empty"]` becomes visible
- **Data:** Seed task via API
- **Locators:**
  - Delete button: `getByTestId('task-delete-1')`
  - Empty state (post-delete): `getByTestId('task-list-empty')`

---

### TC-SCRUM5-008: Empty state shown when no tasks exist

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-6
- **Given:** The user is logged in; `POST /api/reset` has been called so no tasks exist
- **When:** The dashboard renders
- **Then:** `[data-testid="task-list-empty"]` is visible with text "No tasks yet - add one above."; `[data-testid="task-list"]` is not present in the DOM
- **Locators:**
  - Empty state: `getByTestId('task-list-empty')`
  - Task list (assert absent): `getByTestId('task-list')` — expect `count()` to be 0

---

### TC-SCRUM5-009: Empty state disappears after first task is added

- **Priority:** P1
- **Type:** Negative
- **Source:** AC-6
- **Given:** The user is logged in; no tasks exist; the empty-state message is visible
- **When:** The user adds a task "Morning run"
- **Then:** `[data-testid="task-list-empty"]` is no longer visible; `[data-testid="task-list"]` is present
- **Locators:**
  - Input: `getByTestId('add-task-input')`
  - Submit: `getByTestId('add-task-submit')`
  - Empty state: `getByTestId('task-list-empty')` (assert hidden/absent)
  - Task list: `getByTestId('task-list')` (assert visible)

---

### TC-SCRUM5-010: Multiple tasks can be added sequentially

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-1
- **Given:** The user is logged in; no tasks exist
- **When:** The user adds "Task A", then "Task B", then "Task C"
- **Then:** All three tasks appear in `[data-testid="task-list"]`; the list has exactly 3 `<li>` items
- **Data:** Titles: "Task A", "Task B", "Task C"
- **Locators:**
  - Task list: `getByTestId('task-list')`
  - Count assertion: `locator('[data-testid^="task-item-"]').count()` — expect 3

---

### TC-SCRUM5-011: Delete one task from a list of multiple — others remain

- **Priority:** P1
- **Type:** Positive
- **Source:** AC-5
- **Given:** The user is logged in; two tasks exist: "Keep me" (id=1) and "Delete me" (id=2), seeded via API
- **When:** The user clicks `[data-testid="task-delete-2"]`
- **Then:** Task "Delete me" is removed; task "Keep me" remains in the list; list count is 1
- **Data:** Seed both tasks via API before test
- **Locators:**
  - Delete button: `getByTestId('task-delete-2')`
  - Remaining item: `getByTestId('task-item-1')`
  - Removed item: `getByTestId('task-item-2')` (assert absent)

---

### TC-SCRUM5-012: Single-character task title is accepted

- **Priority:** P2
- **Type:** Boundary
- **Source:** AC-1
- **Given:** The user is logged in
- **When:** The user types "X" (1 character) and submits
- **Then:** A new task with title "X" appears in the task list
- **Data:** title = "X"
- **Locators:**
  - Input: `getByTestId('add-task-input')`
  - Submit: `getByTestId('add-task-submit')`
  - Task item text: `getByTestId('task-item-1').getByText('X')`

---

### TC-SCRUM5-013: Task title with leading/trailing whitespace is trimmed

- **Priority:** P2
- **Type:** Boundary
- **Source:** AC-1
- **Given:** The user is logged in
- **When:** The user types "  Trim me  " (with surrounding spaces) and submits
- **Then:** A task with title "Trim me" (trimmed) appears in the list — not "  Trim me  "
- **Data:** title = "  Trim me  "
- **Locators:**
  - Input: `getByTestId('add-task-input')`
  - Submit: `getByTestId('add-task-submit')`
  - Task item text: `getByTestId('task-item-1').getByText('Trim me')` — TODO: add `data-testid="task-title-{id}"` to `<span>` for direct assertion

---

### TC-SCRUM5-014: Unauthenticated API call to /api/tasks returns 401

- **Priority:** P0
- **Type:** Authorization
- **Source:** Implicit — Auth (server-side `requireAuth` middleware)
- **Given:** No Authorization header is provided
- **When:** A `GET /api/tasks` request is made directly (via Playwright `request` fixture or `apiRequest`)
- **Then:** The response status is `401` and the body contains `{ "error": "Unauthorized" }`
- **Data:** No token
- **Locators:** API-only test — no UI locators required
- **Notes:** Implement as a Playwright `request` context test, not a browser test

---

### TC-SCRUM5-015: Dashboard is not rendered before login

- **Priority:** P0
- **Type:** Authorization
- **Source:** Implicit — Auth (client-side `token` state gate in `App.jsx:15`)
- **Given:** The user has not logged in (fresh page load, no stored token)
- **When:** The app loads at `http://localhost:3000`
- **Then:** `[data-testid="dashboard"]` is not present; `[data-testid="login-email-input"]` is visible
- **Locators:**
  - Dashboard (assert absent): `getByTestId('dashboard')`
  - Login form (assert present): `getByTestId('login-email-input')`

---

## Developer TODOs

1. **`TaskList.jsx` line 10 — `<span>` task title has no `data-testid`.**
   Add `data-testid={`task-title-${task.id}`}` to the `<span>` that renders the task title. This enables direct, stable text assertions without falling back to `getByText()`.

2. **`AddTaskForm.jsx` — no error or feedback element for failed submissions.**
   If future validation (e.g., max-length, server error) is added, include a `data-testid="add-task-error"` element so error-state assertions can be grounded in source.

3. **`TaskList.jsx` — dynamic `data-testid` in a `.map()` loop.**
   The pattern `` `task-item-${task.id}` `` is correctly unique per item because IDs are server-assigned integers. No disambiguation issue currently, but tests must use seeded IDs (via `POST /api/reset` + controlled `POST /api/tasks` calls) rather than hardcoded guesses.
