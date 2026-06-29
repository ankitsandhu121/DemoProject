// SCRUM-10: Upload a profile avatar
// Acceptance criteria: AC-1 (chosen filename shown), AC-2 (POST /api/profile/avatar),
// AC-3 (Save shows confirmation toast), AC-4 (/settings only reachable when logged in).
// Test cases TC-SCRUM-10-001 through TC-SCRUM-10-010 are implemented here.
// Source plan: e2e/acceptance/specs/SCRUM-10.md
//
// Grounding (confirmed from source + live run):
//   - Upload fires on file SELECTION (handleAvatar, SettingsPage.jsx:32-37), not on Save.
//   - Toast originates from Save / PUT /api/profile (handleSave, SettingsPage.jsx:39-44),
//     not from the avatar POST.
//   - The chosen-name span (settings-avatar-name, SettingsPage.jsx:66) is conditionally
//     rendered: count 0 until a file is chosen.
//   - Toast auto-dismisses after 3000ms (Toast.jsx default duration).
//   - Auth is client-side route mounting (App.jsx:15): logged-out /settings shows the
//     login form; there is no server redirect. The API 401s protected calls.
//
// Reuse notes:
//   - LoginPage.login() / LoginPage.goto()          → e2e/shared/pages/login.page.js
//   - SettingsPage locators + save()/expectToastVisible()/waitForLoaded()
//     and the SCRUM-10 additions uploadAvatar()/expectAvatarName()
//                                                    → e2e/shared/pages/settings.page.js
//   - NavBar.gotoSettings() (client-side nav)        → e2e/shared/pages/navbar.page.js
//   - demoUser / demoToken                           → e2e/shared/fixtures/auth.js
//   - getApiBaseURL() / resetTestData()              → e2e/shared/seed.base.js
//
// IMPORTANT: the app keeps the auth token in React in-memory state. A hard
// page.goto('/settings') reloads the SPA and bounces to the login form, so the
// authenticated tests log in first and reach Settings via the NavBar (client-side).

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../shared/pages/login.page');
const { SettingsPage } = require('../../shared/pages/settings.page');
const { NavBar } = require('../../shared/pages/navbar.page');
const { demoUser, demoToken } = require('../../shared/fixtures/auth');
const { getApiBaseURL, resetTestData } = require('../../shared/seed.base');

const API_BASE = getApiBaseURL();
const AVATAR_PNG = path.resolve(__dirname, '../../shared/test-data/avatar.png');
const SECOND_JPG = path.resolve(__dirname, '../../shared/test-data/second.jpg');

/** Logs in as the demo user and lands on a loaded /settings page via the NavBar. */
async function loginAndOpenSettings(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(demoUser.email, demoUser.password);
  // app-shell confirms React bootstrapped and the token is set (App.jsx:21)
  await expect(page.getByTestId('app-shell')).toBeVisible();

  const navbar = new NavBar(page);
  await navbar.gotoSettings();

  const settings = new SettingsPage(page);
  await settings.waitForLoaded();
  return settings;
}

test.describe('SCRUM-10: Upload a profile avatar @jira-SCRUM-10', () => {
  test.beforeEach(async () => {
    // Start each run with profile.avatar = null (POST /api/reset re-seeds profile).
    await resetTestData();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-001 | P0 | Positive | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-001 [P0] Selecting a file shows the chosen filename (AC-1)', async ({ page }) => {
    const settings = await loginAndOpenSettings(page);

    await settings.uploadAvatar(AVATAR_PNG);

    await settings.expectAvatarName(path.basename(AVATAR_PNG));
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-002 | P0 | Positive | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-002 [P0] File selection uploads via POST /api/profile/avatar (AC-2)', async ({ page }) => {
    const settings = await loginAndOpenSettings(page);

    // uploadAvatar fires the POST on selection (NOT on Save — Grounding Note 1).
    const response = await settings.uploadAvatar(AVATAR_PNG);

    expect(response.ok()).toBe(true);

    // Request body carries filename + size.
    const requestBody = response.request().postDataJSON();
    expect(requestBody.filename).toBe('avatar.png');
    expect(typeof requestBody.size).toBe('number');
    expect(requestBody.size).toBeGreaterThan(0);

    // Response reflects the stored avatar metadata.
    const body = await response.json();
    expect(body.avatar).toMatchObject({ filename: 'avatar.png' });
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-003 | P0 | Positive | AC-3
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-003 [P0] Saving after choosing an avatar shows the confirmation toast (AC-3)', async ({ page }) => {
    const settings = await loginAndOpenSettings(page);

    await settings.uploadAvatar(AVATAR_PNG);

    // Toast is driven by the Save / PUT /api/profile path — Grounding Note 2.
    await settings.save();
    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-004 | P1 | Negative | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-004 [P1] No file chosen — filename span absent and no upload (AC-1)', async ({ page }) => {
    let avatarPosted = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/profile/avatar')) {
        avatarPosted = true;
      }
    });

    const settings = await loginAndOpenSettings(page);

    // Conditionally rendered span is absent until a file is chosen.
    await expect(settings.avatarName).toHaveCount(0);
    expect(avatarPosted).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-005 | P1 | Equivalence | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-005 [P1] Re-selecting a different file updates the filename and re-uploads (AC-2)', async ({ page }) => {
    const settings = await loginAndOpenSettings(page);

    const firstResponse = await settings.uploadAvatar(AVATAR_PNG);
    expect(firstResponse.request().postDataJSON().filename).toBe('avatar.png');
    await settings.expectAvatarName('avatar.png');

    const secondResponse = await settings.uploadAvatar(SECOND_JPG);
    expect(secondResponse.request().postDataJSON().filename).toBe('second.jpg');
    await settings.expectAvatarName('second.jpg');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-006 | P2 | Boundary | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-006 [P2] Zero-byte file still uploads with size 0 (AC-2)', async ({ page }) => {
    // Generate a 0-byte fixture at runtime in the OS temp dir (not under apps/).
    const emptyFile = path.join(os.tmpdir(), `scrum10-empty-${Date.now()}.png`);
    fs.writeFileSync(emptyFile, '');

    try {
      const settings = await loginAndOpenSettings(page);

      const response = await settings.uploadAvatar(emptyFile);

      expect(response.ok()).toBe(true);
      const requestBody = response.request().postDataJSON();
      expect(requestBody.size).toBe(0);
      expect(requestBody.filename).toBe(path.basename(emptyFile));

      await settings.expectAvatarName(path.basename(emptyFile));
    } finally {
      fs.rmSync(emptyFile, { force: true });
    }
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-007 | P2 | Boundary | AC-3 (Toast.jsx duration=3000)
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-007 [P2] Toast auto-dismisses after its duration (AC-3)', async ({ page }) => {
    const settings = await loginAndOpenSettings(page);

    await settings.uploadAvatar(AVATAR_PNG);
    await settings.save();
    await settings.expectToastVisible('Settings saved');

    // Toast auto-dismisses after ~3000ms; allow auto-retry up to a generous window.
    await expect(settings.toast).toHaveCount(0, { timeout: 6000 });
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-008 | P0 | Authorization | AC-4
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-008 [P0] /settings is not reachable when logged out (AC-4)', async ({ page }) => {
    // Fresh context, no login. Client-side gate (App.jsx:15) — no server redirect.
    await page.goto('/settings');

    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('settings-page')).toHaveCount(0);
    await expect(page.getByTestId('app-shell')).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-009 | P1 | Authorization | AC-4 (API-only)
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-009 [P1] Avatar upload endpoint rejects unauthenticated requests (AC-4)', async ({ request }) => {
    // No Authorization header — requireAuth (server.js:69) must 401.
    const response = await request.post(`${API_BASE}/api/profile/avatar`, {
      data: { filename: 'avatar.png', size: 8 },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });

    // profile.avatar is unchanged (still null after reset) when fetched with auth.
    const profileResponse = await request.get(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    expect(profileResponse.ok()).toBe(true);
    expect((await profileResponse.json()).avatar).toBeFalsy();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM-10-010 | P1 | Positive | AC-2 + AC-3
  // -------------------------------------------------------------------------
  test('TC-SCRUM-10-010 [P1] Upload then save issues two distinct backend calls (AC-2 + AC-3)', async ({ page }) => {
    const calls = [];
    page.on('request', (req) => {
      const url = req.url();
      if (req.method() === 'POST' && url.includes('/api/profile/avatar')) {
        calls.push('POST /api/profile/avatar');
      } else if (req.method() === 'PUT' && url.includes('/api/profile')) {
        calls.push('PUT /api/profile');
      }
    });

    const settings = await loginAndOpenSettings(page);

    await settings.uploadAvatar(AVATAR_PNG);
    await settings.save();
    await settings.expectToastVisible('Settings saved');

    // Exactly one avatar POST (on selection) and one profile PUT (on save), in order.
    expect(calls).toEqual(['POST /api/profile/avatar', 'PUT /api/profile']);
  });
});
