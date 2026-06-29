# Acceptance Test Plan: SCRUM-10 — Upload a profile avatar

## Sources

- **Jira (`atlassian-rovo-mcp`):** NOT fetched. No Atlassian MCP tool was exposed to the
  planner in this invocation (the server is configured in `.vscode/mcp.json` but presented no
  callable `getJiraIssue`/tool surface). Per run instructions, fell back to the **local story
  stub** at `e2e/acceptance/specs/SCRUM-10.md`. Reconcile against the authoritative Jira ticket
  if/when it exists.
- **Comments:** none available (no Jira access).
- **Attachments:** none available (no Jira access). No attachment TODOs.
- **Linked issues / sub-tasks:** none available (no Jira access).
- **PR diff:** none linked / not fetched (no Jira remote links available without MCP).
- **Source of truth used for grounding:**
  - `apps/web/src/pages/SettingsPage.jsx` (avatar input, chosen-name span, save button, toast)
  - `apps/web/src/components/Toast.jsx` (transient `role="status"` toast, 3000ms auto-dismiss)
  - `apps/web/src/components/NavBar.jsx` (nav links with `data-testid`)
  - `apps/web/src/App.jsx` (client-side auth gate; routes only mount when `token` is set)
  - `apps/web/src/api.js` (`uploadAvatar`, `saveProfile`)
  - `apps/api/server.js` (`POST /api/profile/avatar`, `PUT /api/profile`, `requireAuth`)
- **Live confirmation:** Playwright CLI against running dev servers (web :3000, api :4000)
  confirmed every locator below resolves uniquely and the upload + save flow returns 200.

## Story

- **Story ID:** SCRUM-10
- **Title:** Upload a profile avatar
- **As a** logged-in user
- **I want to** upload an avatar image on my Settings page
- **So that** my profile shows my chosen picture

## Acceptance Criteria

| ID | Criterion | Source |
|----|-----------|--------|
| AC-1 | On `/settings`, selecting a file in the avatar input shows the chosen filename. | Local stub |
| AC-2 | Selecting a file uploads it via `POST /api/profile/avatar` (filename + size sent). | Local stub |
| AC-3 | Saving the settings form after choosing an avatar shows the confirmation toast. | Local stub |
| AC-4 | `/settings` is only reachable when logged in. | Local stub |

## Grounding Notes (behavior confirmed from source + live run)

1. **Upload fires on file selection, not on save.** `handleAvatar` (SettingsPage.jsx:32-37)
   calls `uploadAvatar` immediately in the `<input onChange>`. The save button does NOT
   re-upload the avatar. AC-2 must assert against the `POST /api/profile/avatar` triggered by
   `setInputFiles`, not by clicking Save.
2. **Toast originates from save, not from upload.** `handleSave` (SettingsPage.jsx:39-44) issues
   `PUT /api/profile` then sets `toast = 'Settings saved'`. The avatar `POST` does not show a
   toast. AC-3 is therefore a Save-path assertion that happens to follow an avatar selection.
3. **Chosen-name span is conditionally rendered.** `{avatarName && <span ...>}`
   (SettingsPage.jsx:66) — the `settings-avatar-name` element is absent (count 0) until a file is
   chosen. Confirmed live: count 0 before selection, count 1 with text `av.png` after.
4. **Toast auto-dismisses after 3000ms** (Toast.jsx duration default). Toast assertions must run
   promptly after Save; do not add long waits before asserting visibility.
5. **Auth is client-side route mounting (AC-4).** `App.jsx` renders `<LoginForm>` for the entire
   app when `token` is null; the `<Routes>` (including `/settings`) are only mounted once logged
   in. So an unauthenticated visit to `/settings` shows the login form, not the settings page.
   There is no server redirect — the API simply 401s protected calls. UI assertion for AC-4:
   on `/settings` while logged out, the login form is shown and `settings-page` is absent.
6. **API only stores file metadata.** `POST /api/profile/avatar` accepts `{ filename, size }`
   (no multipart). The real `<input type="file">` is still exercised via `setInputFiles`, which
   is what populates filename + size sent in the request body.

## Existing Test Asset Inventory (reuse vs. new)

### `e2e/shared/pages/settings.page.js` — EXISTS (reuse)
Exposes: `goto()`, `waitForLoaded()`, locators `nameInput`, **`avatarInput`**,
**`avatarName`**, `dateInput`, `roleSelect`, `skillsFieldset`, `digestFieldset`,
**`saveButton`**, **`toast`**; methods `updateName`, `selectRole`, `toggleSkill`,
`selectDigest`, **`save()`** (waits for `PUT /api/profile`), **`expectToastVisible()`**.
- REUSE: `avatarInput`, `avatarName`, `saveButton`, `toast`, `save()`, `expectToastVisible()`,
  `goto()`, `waitForLoaded()`.
- GAP: no avatar action helper exists (no `uploadAvatar(filePath)` / `expectAvatarName(name)`).
  See "New page-object methods" below.

### `e2e/shared/pages/login.page.js` — EXISTS (reuse)
Exposes: `emailInput`, `passwordInput`, `submitButton`, `errorMessage`; methods
`goto()`, `login(email, password)`, `expectLoginError()`.
- REUSE: `login()` + `goto()` for the authenticated precondition and for AC-4 logged-out state.

### `e2e/shared/fixtures/auth.js` — EXISTS (reuse)
Exposes `demoUser` (`demo@taskflow.dev` / `demo1234`) and `demoToken` (`demo-token`).
- REUSE: credentials for login; `demoToken` for any direct API seeding/verification.

### `e2e/shared/seed.base.js` — EXISTS (reuse)
Exposes `getApiBaseURL()` and `resetTestData()` (`POST /api/reset`, re-seeds `profile`).
- REUSE: call `resetTestData()` in `beforeEach`/`beforeAll` so each run starts with
  `profile.avatar = null`.

### `e2e/shared/pages/task.page.js` — EXISTS (reference only)
Shows the fallback-locator and `waitForResponse` patterns to mirror. Not used by this story.

### NavBar navigation — NOT covered (new shared helper recommended)
`NavBar.jsx` exposes `data-testid="nav-settings"` (and `nav-tasks/projects/team`), but there is
**no shared NavBar page object** — other specs click `getByTestId('nav-settings')` inline.
Recommend a small shared `NavBar` page object (or a `navigateTo(section)` helper) so this spec
and others stop duplicating the inline click. Until then this plan uses
`page.getByTestId('nav-settings')` directly and flags it.

## Locator Map

All locators required by this story are backed by **real `data-testid` values in source** —
no invented identifiers, no CSS/XPath needed.

| Element | Locator | Backed by data-testid? | Source |
|---------|---------|------------------------|--------|
| Settings page root | `getByTestId('settings-page')` | Yes | SettingsPage.jsx:47 |
| Settings loading | `getByTestId('settings-loading')` | Yes | SettingsPage.jsx:19 |
| Avatar file input | `getByTestId('settings-avatar-input')` | Yes | SettingsPage.jsx:63 |
| Chosen avatar filename | `getByTestId('settings-avatar-name')` | Yes (conditional render) | SettingsPage.jsx:66 |
| Save button | `getByTestId('settings-save')` | Yes | SettingsPage.jsx:123 |
| Confirmation toast | `getByTestId('toast')` | Yes (`role="status"`) | Toast.jsx:15 |
| Settings nav link | `getByTestId('nav-settings')` | Yes | NavBar.jsx:22 |
| Login email/password/submit | `login-email-input` / `login-password-input` / `login-submit-button` | Yes | LoginForm.jsx:34/43/54 |
| App shell (logged-in marker) | `getByTestId('app-shell')` | Yes | App.jsx:21 |

### Reuse vs. new (locators & methods)

| Capability | Status | Where |
|---|---|---|
| `avatarInput`, `avatarName`, `saveButton`, `toast` locators | REUSE | settings.page.js |
| `save()` + `expectToastVisible()` | REUSE | settings.page.js |
| `login()` / login locators | REUSE | login.page.js |
| credentials / token | REUSE | fixtures/auth.js |
| `resetTestData()` | REUSE | seed.base.js |
| **`uploadAvatar(filePath)` action** (setInputFiles + wait for `POST /api/profile/avatar`) | **NEW** | add to settings.page.js |
| **`expectAvatarName(name)` assertion** (avatarName visible + text) | **NEW** | add to settings.page.js |
| **NavBar `navigateTo('settings')` / NavBar page object** | **NEW (recommended)** | new `e2e/shared/pages/navbar.page.js` |

### New page-object methods (proposed signatures for acceptance-generator)

```js
// settings.page.js — NEW
async uploadAvatar(filePath) {
  const responsePromise = this.page.waitForResponse(
    (r) => r.url().includes('/api/profile/avatar') && r.request().method() === 'POST'
  );
  await this.avatarInput.setInputFiles(filePath);
  return responsePromise; // lets callers assert status / request body for AC-2
}

async expectAvatarName(name) {
  await expect(this.avatarName).toBeVisible();
  await expect(this.avatarName).toHaveText(name);
}
```

```js
// navbar.page.js — NEW (recommended shared helper)
class NavBar {
  constructor(page) { this.page = page; }
  async navigateTo(section) { await this.page.getByTestId(`nav-${section}`).click(); }
}
```

## Traceability Matrix

| Test Case ID | Acceptance Criterion | Priority | Type | Notes |
|---|---|---|---|---|
| TC-SCRUM-10-001 | AC-1 | P0 | Positive | Selecting a file renders the chosen filename |
| TC-SCRUM-10-002 | AC-2 | P0 | Positive | File selection POSTs filename + size to `/api/profile/avatar` |
| TC-SCRUM-10-003 | AC-3 | P0 | Positive | Save after choosing avatar shows "Settings saved" toast |
| TC-SCRUM-10-004 | AC-1 | P1 | Negative | No file chosen → filename span never appears, no upload |
| TC-SCRUM-10-005 | AC-2 | P1 | Equivalence | Second file selection re-uploads and updates name |
| TC-SCRUM-10-006 | AC-2 | P2 | Boundary | Zero-byte file → `size: 0` still sent and accepted |
| TC-SCRUM-10-007 | AC-3 | P2 | Boundary | Toast auto-dismisses after ~3000ms |
| TC-SCRUM-10-008 | AC-4 | P0 | Authorization | Logged-out `/settings` shows login form, not settings page |
| TC-SCRUM-10-009 | AC-4 | P1 | Authorization | `POST /api/profile/avatar` without auth returns 401 (API-only) |
| TC-SCRUM-10-010 | AC-2/AC-3 | P1 | Positive | Upload then save: avatar POST and profile PUT are distinct calls |

## Test Cases

### TC-SCRUM-10-001: Selecting a file shows the chosen filename
- Priority: P0
- Type: Positive
- Source: AC-1
- Given: a logged-in user is on `/settings` and the page has loaded (`settings-page` visible)
- When: they select `avatar.png` in the avatar input (`setInputFiles`)
- Then: `settings-avatar-name` becomes visible and reads `avatar.png`
- Data: small fixture image; reset state first so `profile.avatar` is null
- Locators: `getByTestId('settings-avatar-input')`, `getByTestId('settings-avatar-name')`

### TC-SCRUM-10-002: File selection uploads via POST /api/profile/avatar
- Priority: P0
- Type: Positive
- Source: AC-2
- Given: a logged-in user is on `/settings`
- When: they select `avatar.png`
- Then: a `POST /api/profile/avatar` is sent with body `{ filename: 'avatar.png', size: <n> }`
  and returns 200; response `profile.avatar` reflects the filename + size
- Data: assert request post-data via `page.waitForRequest`/`waitForResponse`
- Locators: `getByTestId('settings-avatar-input')`; network assertion on `/api/profile/avatar`
- Note: upload fires on selection (handleAvatar), NOT on Save — see Grounding Note 1

### TC-SCRUM-10-003: Saving after choosing an avatar shows the confirmation toast
- Priority: P0
- Type: Positive
- Source: AC-3
- Given: a logged-in user on `/settings` has just selected an avatar
- When: they click Save (`settings-save`)
- Then: `PUT /api/profile` returns 200 and the `toast` shows "Settings saved"
- Data: reuse `settings.page.save()` + `expectToastVisible('Settings saved')`
- Locators: `getByTestId('settings-save')`, `getByTestId('toast')`
- Note: toast is driven by the Save/`PUT /api/profile` path, not the avatar POST — Grounding Note 2

### TC-SCRUM-10-004: No file chosen — filename span absent, no upload
- Priority: P1
- Type: Negative
- Source: AC-1
- Given: a logged-in user lands on `/settings` and selects nothing
- When: the page is inspected before any file selection
- Then: `settings-avatar-name` has count 0 (not rendered) and no `POST /api/profile/avatar`
  has been issued
- Data: confirmed live — span count 0 pre-selection
- Locators: `getByTestId('settings-avatar-name')` (expect count 0)

### TC-SCRUM-10-005: Re-selecting a different file updates the filename and re-uploads
- Priority: P1
- Type: Equivalence
- Source: AC-2
- Given: a logged-in user has already selected `first.png`
- When: they select `second.jpg`
- Then: `settings-avatar-name` updates to `second.jpg` and a second
  `POST /api/profile/avatar` is sent with `filename: 'second.jpg'`
- Data: two distinct fixture files
- Locators: `getByTestId('settings-avatar-input')`, `getByTestId('settings-avatar-name')`

### TC-SCRUM-10-006: Zero-byte file still uploads with size 0
- Priority: P2
- Type: Boundary
- Source: AC-2
- Given: a logged-in user on `/settings`
- When: they select an empty (0-byte) file
- Then: `POST /api/profile/avatar` is sent with `size: 0`, returns 200, and the filename span
  shows the chosen name
- Data: generate a 0-byte fixture in the test
- Locators: `getByTestId('settings-avatar-input')`; network assertion

### TC-SCRUM-10-007: Toast auto-dismisses after its duration
- Priority: P2
- Type: Boundary
- Source: AC-3 (implicit — Toast.jsx duration=3000)
- Given: a logged-in user has saved settings and the toast is visible
- When: ~3000ms elapse
- Then: the `toast` element is removed from the DOM (count 0)
- Data: rely on Toast.jsx default 3000ms; use Playwright auto-wait, avoid hardcoded sleeps
  beyond the dismiss window
- Locators: `getByTestId('toast')` (expect hidden/count 0 after dismiss)

### TC-SCRUM-10-008: `/settings` is not reachable when logged out
- Priority: P0
- Type: Authorization
- Source: AC-4
- Given: a user who is NOT logged in (fresh context, no token)
- When: they navigate directly to `/settings`
- Then: the login form is shown (`login-email-input` visible) and `settings-page` is absent
  (count 0); the app shell does not mount
- Data: do not log in; navigate via `page.goto('/settings')`
- Locators: `getByTestId('login-email-input')` (visible), `getByTestId('settings-page')` (count 0)
- Note: client-side gate, no server redirect — Grounding Note 5

### TC-SCRUM-10-009: Avatar upload endpoint rejects unauthenticated requests
- Priority: P1
- Type: Authorization
- Source: AC-4 (API-only — cannot be exercised through the UI, which never sends an
  unauthenticated avatar POST)
- Given: an API request context with no/invalid `Authorization` header
- When: `POST /api/profile/avatar` is called with `{ filename, size }`
- Then: the API returns 401 `{ error: 'Unauthorized' }` and `profile.avatar` is unchanged
- Data: use `request.newContext()` against `getApiBaseURL()`; `requireAuth` (server.js:69)
- Locators: none (API-only)

### TC-SCRUM-10-010: Upload then save issues two distinct backend calls
- Priority: P1
- Type: Positive
- Source: AC-2 + AC-3
- Given: a logged-in user on `/settings`
- When: they select an avatar, then click Save
- Then: exactly one `POST /api/profile/avatar` (on selection) and one `PUT /api/profile`
  (on save) are observed, in that order; toast appears only after the PUT
- Data: capture both requests; assert ordering and that Save does not re-POST the avatar
- Locators: `getByTestId('settings-avatar-input')`, `getByTestId('settings-save')`,
  `getByTestId('toast')`

## TODOs

### data-testid (developer)
- **No new `data-testid` gaps for this story.** Every element this plan touches
  (`settings-avatar-input`, `settings-avatar-name`, `settings-save`, `toast`, `nav-settings`,
  login fields, `settings-page`) already has a stable `data-testid` in source.
- (Pre-existing, out of scope for SCRUM-10) NavBar logout button has no `data-testid`
  (NavBar.jsx:31) and digest radios have no `data-testid` (SettingsPage.jsx:108) — already
  tracked in `settings.page.js` / NavBar comments; not required by this story.

### Test framework (for acceptance-generator)
- Add `uploadAvatar(filePath)` and `expectAvatarName(name)` to `e2e/shared/pages/settings.page.js`
  (signatures above).
- Create a shared NavBar page object / `navigateTo(section)` helper
  (`e2e/shared/pages/navbar.page.js`) to replace inline `getByTestId('nav-settings')` clicks
  across specs.
- Provide a small fixture image (and a 0-byte file generated at runtime) for `setInputFiles`.

### Attachments
- None to ingest (no Jira access this run). No attachment TODOs.

### Jira reconciliation
- Re-fetch SCRUM-10 from Jira once MCP access is available and reconcile AC wording, comments,
  linked issues, and any PR diff against this stub-derived plan.
