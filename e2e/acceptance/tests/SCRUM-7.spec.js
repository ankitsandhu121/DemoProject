// SCRUM-7: Remove team member with confirmation and toast
// Acceptance criteria (derived from source — see plan):
//   AC-1 team list shows each member + Remove button (TeamPage.jsx:25-42)
//   AC-2 Remove opens a confirmation modal "Remove member" / "Remove {name} from the team?";
//        member NOT removed until confirmed (TeamPage.jsx:36,44-51)
//   AC-3 Confirm calls DELETE /api/members/:id, removes the row, closes the modal,
//        shows toast "{name} removed from the team" (TeamPage.jsx:17-22,49)
//   AC-4 Toast (role="status") auto-dismisses after default duration 3000ms (Toast.jsx:5-18)
//   AC-5 Cancel closes the modal, keeps the member, shows no toast (TeamPage.jsx:50, Modal.jsx:15)
// Test cases TC-SCRUM-7-001 through TC-SCRUM-7-007 are implemented here.
// Source plan: e2e/acceptance/specs/SCRUM-7.md
//
// Grounding (confirmed from source):
//   - Seed members (restored by POST /api/reset): 1 Ada Lovelace, 2 Grace Hopper,
//     3 Alan Turing, 4 Katherine Johnson (server.js:38-42).
//   - The per-member row button AND the modal confirm button are both labeled "Remove"
//     (confirmLabel="Remove", TeamPage.jsx:48) — confirm must be modal-scoped
//     (getByTestId('modal-confirm')) to disambiguate.
//   - Modal renders only while open (Modal.jsx:4) — assert by visibility.
//   - Toast auto-dismisses after 3000ms (Toast.jsx default duration).
//
// Reuse notes:
//   - LoginPage.login() / LoginPage.goto()        → e2e/shared/pages/login.page.js
//   - NavBar.navigateTo('team') (client-side nav) → e2e/shared/pages/navbar.page.js
//   - TeamPage locators + openRemove()            → e2e/shared/pages/team.page.js
//   - DialogPage confirm()/cancel()/toast helpers → e2e/shared/pages/dialog.page.js
//   - demoUser                                    → e2e/shared/fixtures/auth.js
//   - resetTestData()                             → e2e/shared/seed.base.js
//
// IMPORTANT: the app keeps the auth token in React in-memory state. A hard
// page.goto('/team') reloads the SPA and bounces to the login form, so tests log
// in first and reach Team via the NavBar (client-side navigation).

'use strict';

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../shared/pages/login.page');
const { NavBar } = require('../../shared/pages/navbar.page');
const { TeamPage } = require('../../shared/pages/team.page');
const { DialogPage } = require('../../shared/pages/dialog.page');
const { demoUser } = require('../../shared/fixtures/auth');
const { resetTestData } = require('../../shared/seed.base');

// Seed members restored by POST /api/reset (server.js:38-42).
const MEMBERS = {
  ada: { id: 1, name: 'Ada Lovelace' },
  grace: { id: 2, name: 'Grace Hopper' },
  alan: { id: 3, name: 'Alan Turing' },
  katherine: { id: 4, name: 'Katherine Johnson' },
};

/** Logs in as the demo user and lands on a loaded /team page via the NavBar. */
async function loginAndOpenTeam(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(demoUser.email, demoUser.password);
  // app-shell confirms React bootstrapped and the token is set.
  await expect(page.getByTestId('app-shell')).toBeVisible();

  const navbar = new NavBar(page);
  await navbar.navigateTo('team');

  const team = new TeamPage(page);
  await team.waitForLoaded();
  return team;
}

test.describe('SCRUM-7: Remove team member with confirmation and toast @jira-SCRUM-7', () => {
  test.beforeEach(async () => {
    // Restore seed members; removals mutate shared in-memory API state.
    await resetTestData();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-001 | P0 | Positive | AC-3, AC-4
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-001 [P0] Remove a member, see toast, toast auto-dismisses (AC-3, AC-4)', async ({ page }) => {
    const { id, name } = MEMBERS.alan;
    const team = await loginAndOpenTeam(page);
    const dialog = new DialogPage(page);

    await team.openRemove(id);
    await dialog.expectOpen();
    await dialog.confirm();

    // Modal closes, member row removed, toast appears with removal text.
    await dialog.expectClosed();
    await expect(team.memberRow(id)).toHaveCount(0);
    await dialog.expectToast(`${name} removed from the team`);

    // Toast auto-dismisses after ~3000ms and leaves the DOM (AC-4).
    await dialog.expectToastDismissed();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-002 | P0 | Positive | AC-5
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-002 [P0] Cancel leaves the member in place and shows no toast (AC-5)', async ({ page }) => {
    const { id } = MEMBERS.grace;
    const team = await loginAndOpenTeam(page);
    const dialog = new DialogPage(page);

    await team.openRemove(id);
    await dialog.expectOpen();
    // Cancel via the modal-scoped role/name fallback baked into DialogPage.
    await dialog.cancel();

    await dialog.expectClosed();
    await expect(team.memberRow(id)).toBeVisible();
    await dialog.expectNoToast();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-003 | P0 | Negative | AC-2 (confirmation gating)
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-003 [P0] Confirmation gating — Remove click alone does not delete (AC-2)', async ({ page }) => {
    const { id } = MEMBERS.ada;
    const team = await loginAndOpenTeam(page);
    const dialog = new DialogPage(page);

    await team.openRemove(id);

    // No confirmation: modal stays open and the member is still listed.
    await dialog.expectOpen();
    await expect(team.memberRow(id)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-004 | P1 | Positive | AC-2 (modal title + message)
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-004 [P1] Modal shows correct title and message (AC-2)', async ({ page }) => {
    const { id, name } = MEMBERS.katherine;
    const team = await loginAndOpenTeam(page);
    const dialog = new DialogPage(page);

    await team.openRemove(id);

    await dialog.expectOpen();
    await expect(dialog.title).toHaveText('Remove member');
    // Message has no data-testid — assert via modal-scoped text (see DialogPage TODO).
    await expect(dialog.message(`Remove ${name} from the team?`)).toBeVisible();
    await expect(dialog.confirmButton).toHaveText('Remove');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-005 | P1 | Positive (data variation) | AC-3
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-005 [P1] Remove a second distinct member (AC-3)', async ({ page }) => {
    const { id, name } = MEMBERS.grace;
    const team = await loginAndOpenTeam(page);
    const dialog = new DialogPage(page);

    await team.openRemove(id);
    await dialog.expectOpen();
    await dialog.confirm();

    await dialog.expectClosed();
    await expect(team.memberRow(id)).toHaveCount(0);
    // Name is interpolated per-member.
    await dialog.expectToast(`${name} removed from the team`);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-006 | P1 | Positive | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-006 [P1] Team list renders all seed members with Remove controls (AC-1)', async ({ page }) => {
    const team = await loginAndOpenTeam(page);

    await expect(team.memberList).toBeVisible();

    for (const { id, name } of Object.values(MEMBERS)) {
      await expect(team.memberRow(id)).toBeVisible();
      await expect(team.memberName(id)).toHaveText(name);
      await expect(team.memberRemove(id)).toBeVisible();
    }
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-7-007 | P2 | Accessibility | AC-2, AC-4
  // -------------------------------------------------------------------------
  test('TC-SCRUM-7-007 [P2] Accessibility — dialog and toast roles/names (AC-2, AC-4)', async ({ page }) => {
    const { id, name } = MEMBERS.alan;
    const team = await loginAndOpenTeam(page);
    const dialog = new DialogPage(page);

    await team.openRemove(id);

    // Modal reachable by role "dialog" with accessible name from the title.
    await expect(dialog.dialogByRole('Remove member')).toBeVisible();

    await dialog.confirm();

    // Toast reachable by role "status" with the removal text.
    const status = dialog.toastByRole();
    await expect(status).toBeVisible();
    await expect(status).toHaveText(`${name} removed from the team`);
  });
});
