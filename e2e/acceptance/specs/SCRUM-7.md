# SCRUM-7 — Remove team member with confirmation and toast

Lane: acceptance (in-sprint, targets dev/local). Web `http://localhost:3000`, API `http://localhost:4000`.

## Sources

- **Jira (atlassian-rovo-mcp):** UNREACHABLE from this session. No Atlassian MCP tools were
  exposed to the agent and the MCP CLI was unavailable, so SCRUM-7 could not be fetched (one
  retry attempted, also failed). Title used as provided by the requester: "Remove team member
  with confirmation and toast".
- **Named local stub:** `e2e/acceptance/specs/SCRUM-7.md` was reported to exist but is ABSENT on
  disk (confirmed via `ls` — file not found). It was not used.
- **Fallback grounding:** Because both Jira and the stub were unavailable, this plan is grounded
  directly in verified application source (read this session):
  - `apps/web/src/pages/TeamPage.jsx` — team list, remove flow, modal wiring, toast wiring.
  - `apps/web/src/components/Modal.jsx` — confirmation dialog (Cancel has no `data-testid`).
  - `apps/web/src/components/Toast.jsx` — `role="status"`, auto-dismiss after `duration` (default 3000ms).
  - `apps/api/server.js` — `GET /api/members`, `DELETE /api/members/:id` (both `requireAuth`),
    seed members, `POST /api/reset`.
- **Comments / attachments / linked issues / PR diff:** none ingested — unavailable without Jira
  access. No amended ACs, no attachments to flag, no linked keys. ACs below are *derived from
  source* and labeled as such; reconcile against Jira when connectivity is restored.

## Story (derived from source — pending Jira confirmation)

- **Story ID:** SCRUM-7
- **Title:** Remove team member with confirmation and toast
- **As a** team administrator
- **I want** to remove a team member behind a confirmation dialog and see a toast notification
- **So that** I do not remove members accidentally and I get clear feedback that the removal succeeded

### Acceptance criteria (derived from source)

- **AC-1 (source: TeamPage.jsx:25-42):** The Team page lists all members; each member row shows the
  member name and a "Remove" button.
- **AC-2 (source: TeamPage.jsx:36, 44-51):** Clicking a member's "Remove" button opens a
  confirmation modal titled "Remove member" with the message `Remove {name} from the team?` and a
  confirm button labeled "Remove". The member is NOT removed yet (confirmation gating).
- **AC-3 (source: TeamPage.jsx:17-22, 49):** Confirming in the modal calls
  `DELETE /api/members/:id`, removes the member from the list, closes the modal, and shows a toast
  with text `{name} removed from the team`.
- **AC-4 (source: Toast.jsx:5-18):** The toast (`role="status"`) auto-dismisses after the default
  duration (3000ms) and is removed from the DOM.
- **AC-5 (source: TeamPage.jsx:50, Modal.jsx:15):** Cancelling the modal closes it, leaves the
  member in the list, and shows no toast.

### Business rules / constraints

- All `/api/members` reads and the `DELETE` are `requireAuth` — the user must be authenticated
  (demo user). (server.js:139-145)
- Seed members (restored by `POST /api/reset`): `1 Ada Lovelace (Owner)`, `2 Grace Hopper (Admin)`,
  `3 Alan Turing (Member)`, `4 Katherine Johnson (Member)`. (server.js:38-42)
- Modal is rendered only while open (`Modal.jsx:4` `if (!open) return null`) — tests can assert
  appearance/disappearance by visibility.
- Confirm button label is "Remove" for this story (`confirmLabel="Remove"`, TeamPage.jsx:48); the
  per-member row button is also labeled "Remove", so modal-scoped locators must be used to
  disambiguate.
- The auth token lives in React in-memory state (App.jsx). Use client-side NavBar navigation, not
  `page.goto`, to reach `/team` after login, or the SPA bounces back to login (see navbar.page.js
  header note).

### Implicit requirements

- **Accessibility:** Modal is `role="dialog" aria-modal="true" aria-label="Remove member"`; Toast
  is `role="status"`. Cancel/confirm reachable by accessible name.
- **Isolation / cleanup:** reset seed data before each test via `resetTestData()`; removals mutate
  shared in-memory API state.

## Traceability Matrix

| Test Case ID | Acceptance Criterion | Priority | Type | Notes |
| --- | --- | --- | --- | --- |
| TC-SCRUM-7-001 | AC-3, AC-4 | P0 | Positive | Happy path: remove + toast + auto-dismiss |
| TC-SCRUM-7-002 | AC-5 | P0 | Positive | Cancel keeps member, no toast |
| TC-SCRUM-7-003 | AC-2 | P0 | Negative | Confirmation gating: Remove click alone does not delete |
| TC-SCRUM-7-004 | AC-2 | P1 | Positive | Modal title + message text correct |
| TC-SCRUM-7-005 | AC-3 | P1 | Positive | Remove a second distinct member (data variation) |
| TC-SCRUM-7-006 | AC-1 | P1 | Positive | Team list renders all seed members with Remove buttons |
| TC-SCRUM-7-007 | AC-2, AC-4 (a11y) | P2 | Accessibility | Modal dialog + toast status roles/names present |

Every AC has at least one test case (AC-1→006, AC-2→003/004/007, AC-3→001/005, AC-4→001/007, AC-5→002).

## Test Cases

### TC-SCRUM-7-001: Remove a member, see toast, toast auto-dismisses
- Priority: P0
- Type: Positive
- Source: AC-3, AC-4
- Given: demo user is logged in and on the Team page with seed members loaded
- When: the user clicks Remove on Alan Turing (id 3) and clicks the modal confirm "Remove" button
- Then: the modal closes; `member-row-3` is removed from the list; a toast appears with text
  `Alan Turing removed from the team`; then the toast disappears from the DOM after auto-dismiss
- Data: member id 3 (Alan Turing); reset seed before test
- Locators: `team.page` → `memberRemove(3)` → modal confirm `getByTestId('modal-confirm')` →
  assert `getByTestId('member-row-3')` hidden, `getByTestId('toast')` visible/text then hidden

### TC-SCRUM-7-002: Cancel leaves the member in place and shows no toast
- Priority: P0
- Type: Positive
- Source: AC-5
- Given: demo user is on the Team page with seed members
- When: the user clicks Remove on Grace Hopper (id 2), then clicks Cancel in the modal
- Then: the modal closes (`modal` hidden); `member-row-2` is still present; `toast` never appears
- Data: member id 2 (Grace Hopper)
- Locators: `memberRemove(2)` → Cancel fallback `modal.getByRole('button', { name: 'Cancel' })`
  (no `data-testid` — see TODO) → assert `member-row-2` visible, `toast` hidden

### TC-SCRUM-7-003: Confirmation gating — Remove click alone does not delete
- Priority: P0
- Type: Negative
- Source: AC-2
- Given: demo user is on the Team page with seed members
- When: the user clicks Remove on Ada Lovelace (id 1) and does NOT confirm (no further action)
- Then: the modal is open; `member-row-1` is still present in the list (member not yet removed)
- Data: member id 1 (Ada Lovelace)
- Locators: `memberRemove(1)` → assert `getByTestId('modal')` visible AND `member-row-1` still visible

### TC-SCRUM-7-004: Modal shows correct title and message
- Priority: P1
- Type: Positive
- Source: AC-2
- Given: demo user is on the Team page with seed members
- When: the user clicks Remove on Katherine Johnson (id 4)
- Then: `modal-title` reads `Remove member`; modal message reads `Remove Katherine Johnson from the team?`;
  confirm button is labeled `Remove`
- Data: member id 4 (Katherine Johnson)
- Locators: `getByTestId('modal-title')` text; message via `modal.getByText('Remove Katherine Johnson from the team?')`
  (no `data-testid` on `<p class="modal-message">` — see TODO); confirm `getByTestId('modal-confirm')` text "Remove"

### TC-SCRUM-7-005: Remove a second distinct member
- Priority: P1
- Type: Positive (data variation / equivalence)
- Source: AC-3
- Given: demo user is on the Team page with seed members
- When: the user removes Grace Hopper (id 2) via confirm
- Then: `member-row-2` is removed; toast text is `Grace Hopper removed from the team`
- Data: member id 2 (Grace Hopper); demonstrates the name is interpolated per-member
- Locators: same flow as TC-001 with id 2

### TC-SCRUM-7-006: Team list renders all seed members with Remove controls
- Priority: P1
- Type: Positive
- Source: AC-1
- Given: demo user has just navigated to the Team page
- When: the members list loads
- Then: `member-list` is visible; rows for ids 1-4 are present with correct names
  (`member-name-{id}`) and each row exposes a `member-remove-{id}` button
- Data: seed members 1-4
- Locators: `getByTestId('member-list')`; `getByTestId('member-row-{id}')` count/visibility;
  `getByTestId('member-name-{id}')` text; `getByTestId('member-remove-{id}')` visible

### TC-SCRUM-7-007: Accessibility — dialog and toast roles/names
- Priority: P2
- Type: Accessibility
- Source: AC-2, AC-4
- Given: demo user is on the Team page
- When: the user opens the remove modal for any member, then confirms
- Then: the modal is reachable as `getByRole('dialog', { name: 'Remove member' })`; after confirm,
  the toast is reachable as `getByRole('status')` with the removal text
- Data: any seed member (e.g. id 3)
- Locators: `getByRole('dialog', { name: 'Remove member' })`; `getByRole('status')`

## Locator inventory / reuse

### data-testid backed (grounded in source)
| Element | Locator | Source |
| --- | --- | --- |
| Team page container | `getByTestId('team-page')` | TeamPage.jsx:25 |
| Member list | `getByTestId('member-list')` | TeamPage.jsx:28 |
| Member row | `getByTestId('member-row-{id}')` | TeamPage.jsx:30 |
| Member name | `getByTestId('member-name-{id}')` | TeamPage.jsx:31 |
| Member remove button | `getByTestId('member-remove-{id}')` | TeamPage.jsx:34 |
| Modal overlay | `getByTestId('modal-overlay')` | Modal.jsx:7 |
| Modal dialog | `getByTestId('modal')` (role `dialog`, name "Remove member") | Modal.jsx:8 |
| Modal title | `getByTestId('modal-title')` | Modal.jsx:9 |
| Modal confirm ("Remove") | `getByTestId('modal-confirm')` | Modal.jsx:18 |
| Toast | `getByTestId('toast')` (role `status`) | Toast.jsx:15 |

### Fallback locators (first-class per source-grounded-locators step 3)
- **Modal Cancel button:** no `data-testid` (intentional, Modal.jsx:14-17). Use a modal-scoped
  role/name locator so it is not confused with any page-level button:
  `getByTestId('modal').getByRole('button', { name: 'Cancel' })`.
- **Modal message paragraph:** no `data-testid` (`<p class="modal-message">`, Modal.jsx:12). Assert
  via modal-scoped text: `getByTestId('modal').getByText('Remove {name} from the team?')`.

### REUSE (do not re-implement)
- `e2e/shared/pages/login.page.js` → `LoginPage.login(email, password)` and `goto()`.
- `e2e/shared/pages/navbar.page.js` → `NavBar.navigateTo('team')` for client-side navigation that
  preserves React in-memory auth state (do NOT `page.goto('/team')`).
- `e2e/shared/fixtures/auth.js` → `demoUser` (email/password), `demoToken`.
- `e2e/shared/seed.base.js` → `resetTestData()` (calls `POST /api/reset`) and `getApiBaseURL()`;
  run `resetTestData()` in `beforeEach` so removals don't leak across tests.

### CREATE
- **`e2e/shared/pages/team.page.js`** — no existing page object covers the Team page. It should
  expose: `teamPage` (`team-page`), `memberList`, `memberRow(id)`, `memberName(id)`,
  `memberRemove(id)`, and actions `openRemove(id)`. Conform to repo conventions: class-based POM,
  CommonJS `require`, `.page.js` naming, comment-header locator-source notes.
- **Modal + Toast as a shared component page object — RECOMMENDED.** Create
  **`e2e/shared/pages/dialog.page.js`** (confirmation modal) and surface the toast either there or
  as a tiny `toast.page.js`. Rationale: `Modal` and `Toast` are reusable components
  (`apps/web/src/components/`) already wired into other flows (e.g. delete confirmations elsewhere),
  so centralizing `confirm()`, `cancel()` (with the Cancel fallback baked in), `dialog` role
  locator, and `toast` role/text assertions prevents every future spec from re-deriving the Cancel
  fallback and the auto-dismiss wait. `team.page.js` can compose these rather than duplicating modal
  internals.

## TODOs

- **TODO (developer):** add `data-testid="modal-cancel"` to the Cancel button in
  `apps/web/src/components/Modal.jsx` (currently intentionally omitted, line 14-17). Until then the
  test uses the modal-scoped `getByRole('button', { name: 'Cancel' })` fallback. Do NOT edit app
  source from the test layer.
- **TODO (developer):** add `data-testid="modal-message"` to `<p class="modal-message">`
  (`Modal.jsx:12`) so message text assertions are id-backed instead of text-scoped.
- **TODO (process):** Jira MCP (`atlassian-rovo-mcp`) was unreachable and the named local stub was
  absent — ACs here are derived from source. Re-validate this plan against the real SCRUM-7 ticket
  (summary, acceptance criteria, comments, attachments, linked issues, PR diff) once MCP
  connectivity is restored, and update the Traceability Matrix if the ticket differs.
