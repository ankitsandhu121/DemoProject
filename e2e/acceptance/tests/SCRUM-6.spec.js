// SCRUM-6: User Profile Settings — View and Update Profile
// Acceptance criteria: AC-1 through AC-8.
// All 15 test cases (TC-SCRUM6-001 through TC-SCRUM6-015) are implemented here.
//
// Seed strategy:
//   - Each test resets server state via POST /api/reset before running.
//   - POST /api/reset restores profile to seed defaults:
//       displayName: 'Demo User', role: 'Member', startDate: '2024-01-15',
//       skills: ['playwright', 'react'], digest: 'weekly'
//   - UI interactions are used only when the UI behavior itself is under test.
//
// Auth:
//   - Browser tests log in via LoginPage before navigating to /settings.
//   - TC-SCRUM6-014 is an API-only test using the Playwright `request` fixture.
//
// Locator notes:
//   - Digest radio inputs inside SettingsPage.jsx:108 have no data-testid.
//     settings.digestRadio(freq) uses getByTestId('settings-digest').getByRole('radio', { name: /freq/ })
//     as a first-class fallback per the source-grounded-locators skill.
//     TODO (developer): add data-testid="digest-{freq}" to each radio <input> in SettingsPage.jsx.

'use strict';

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../shared/pages/login.page');
const { SettingsPage } = require('../../shared/pages/settings.page');
const { demoUser, demoToken } = require('../../shared/fixtures/auth');
const { getApiBaseURL } = require('../../shared/seed.base');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_BASE = getApiBaseURL();
const AUTH_HEADER = { Authorization: `Bearer ${demoToken}` };

/** Resets all server-side state (tasks + profile) to seed defaults. */
async function reset(request) {
  await request.post(`${API_BASE}/api/reset`);
}

/** Logs the browser in as the demo user and navigates to Settings via the NavBar link.
 *
 * IMPORTANT: The app uses React in-memory state for the auth token (useState).
 * A hard browser navigation (page.goto) causes a full page reload which destroys
 * React state and resets the token to null, sending the user back to the login form.
 * We must use the client-side NavBar link (data-testid="nav-settings") instead.
 */
async function loginAndGoToSettings(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(demoUser.email, demoUser.password);
  // Wait for the app shell — this confirms React bootstrapped and token is set
  await expect(page.getByTestId('dashboard')).toBeVisible();
  // Use client-side navigation to preserve React state
  await page.getByTestId('nav-settings').click();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('SCRUM-6: User Profile Settings — View and Update Profile @jira-SCRUM-6', () => {

  // -------------------------------------------------------------------------
  // TC-SCRUM6-001 | P0 | Positive | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-001 [P0] Profile loads with seeded default values (AC-1)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    // Seed defaults
    await expect(settings.nameInput).toHaveValue('Demo User');
    await expect(settings.roleSelect).toHaveValue('Member');

    // Skills: playwright + react seeded as checked; node/typescript/css unchecked
    await expect(settings.skillCheckbox('playwright')).toBeChecked();
    await expect(settings.skillCheckbox('react')).toBeChecked();
    await expect(settings.skillCheckbox('node')).not.toBeChecked();

    // Digest: weekly seeded as selected
    // TODO (developer): add data-testid="digest-weekly" to the weekly radio in SettingsPage.jsx
    await expect(settings.digestRadio('weekly')).toBeChecked();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-002 | P1 | Positive | AC-7
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-002 [P1] Loading indicator shown while profile is fetching (AC-7)', async ({ page, request }) => {
    await reset(request);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(demoUser.email, demoUser.password);
    // Wait for app shell before setting up route interception
    await expect(page.getByTestId('dashboard')).toBeVisible();

    // Delay GET /api/profile to guarantee the loading state is observable
    let resolveDelay;
    const delayPromise = new Promise((res) => { resolveDelay = res; });

    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await delayPromise;
      }
      await route.continue();
    });

    // Use client-side NavBar navigation to preserve React auth state
    await page.getByTestId('nav-settings').click();

    await expect(page.getByTestId('settings-loading')).toBeVisible();

    // Unblock the API response
    resolveDelay();

    // Loading indicator disappears; settings page renders
    await expect(page.getByTestId('settings-loading')).toHaveCount(0, { timeout: 10000 });
    await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-003 | P0 | Positive | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-003 [P0] Update display name and save — success toast appears (AC-2)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    await settings.updateName('Jane Smith');
    await settings.save();

    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-004 | P1 | Positive | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-004 [P1] Saved display name is reflected in the form after save (AC-2)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    await settings.updateName('Jane Smith');
    await settings.save();

    // After save the component sets state from the API response
    await expect(settings.nameInput).toHaveValue('Jane Smith');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-005 | P1 | Boundary | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-005 [P1] Display name cleared to empty string — save is still submitted (AC-2)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    // Intercept PUT /api/profile to capture the request body
    let capturedBody;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/profile')) {
        capturedBody = req.postDataJSON();
      }
    });

    await settings.updateName('');
    await settings.save();

    // API should have been called with an empty displayName
    expect(capturedBody).toMatchObject({ displayName: '' });
    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-006 | P1 | Positive | AC-3
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-006 [P1] Avatar file upload shows filename in UI (AC-3)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    // Use a real small file from the e2e fixtures directory; fall back to the
    // test file itself if no dedicated fixture image exists.
    const avatarFilePath = path.resolve(__dirname, '../../shared/fixtures/avatar.png');
    const fallbackPath = __filename; // any real file will satisfy setInputFiles

    let filePath;
    try {
      require('fs').accessSync(avatarFilePath);
      filePath = avatarFilePath;
    } catch {
      filePath = fallbackPath;
    }

    const expectedName = path.basename(filePath);

    // Set up the response promise BEFORE triggering the upload so we don't miss
    // the response if it fires before waitForResponse is registered.
    // Use a 10 000ms timeout — the global actionTimeout (3000ms) does not apply here.
    const avatarResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/profile/avatar') && resp.request().method() === 'POST',
      { timeout: 10000 }
    );

    await settings.avatarInput.setInputFiles(filePath);

    // Filename span appears immediately (client-side state update)
    await expect(settings.avatarName).toBeVisible();
    await expect(settings.avatarName).toContainText(expectedName);

    // Confirm POST /api/profile/avatar was called and returned successfully
    const avatarResponse = await avatarResponsePromise;
    expect(avatarResponse.ok()).toBe(true);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-007 | P0 | Positive | AC-4
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-007 [P0] Change role and save — success toast appears (AC-4)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    let capturedBody;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/profile')) {
        capturedBody = req.postDataJSON();
      }
    });

    await settings.selectRole('Admin');
    await settings.save();

    expect(capturedBody).toMatchObject({ role: 'Admin' });
    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-008 | P1 | Equivalence | AC-4
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-008 [P1] All four role options are selectable (AC-4)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    const roles = ['Owner', 'Admin', 'Member', 'Viewer'];

    for (const role of roles) {
      await settings.selectRole(role);
      await expect(settings.roleSelect).toHaveValue(role);
    }
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-009 | P0 | Positive | AC-5
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-009 [P0] Toggle a skill on — skill added and saved (AC-5)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    // Pre-condition: "node" is unchecked in seed state
    await expect(settings.skillCheckbox('node')).not.toBeChecked();

    let capturedBody;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/profile')) {
        capturedBody = req.postDataJSON();
      }
    });

    await settings.toggleSkill('node');
    await expect(settings.skillCheckbox('node')).toBeChecked();

    await settings.save();

    expect(capturedBody.skills).toContain('node');
    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-010 | P1 | Positive | AC-5
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-010 [P1] Toggle a skill off — skill removed and saved (AC-5)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    // Pre-condition: "playwright" is checked in seed state
    await expect(settings.skillCheckbox('playwright')).toBeChecked();

    let capturedBody;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/profile')) {
        capturedBody = req.postDataJSON();
      }
    });

    await settings.toggleSkill('playwright');
    await expect(settings.skillCheckbox('playwright')).not.toBeChecked();

    await settings.save();

    expect(capturedBody.skills).not.toContain('playwright');
    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-011 | P2 | Boundary | AC-5
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-011 [P2] All five skills can be selected simultaneously (AC-5)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    const allSkills = ['playwright', 'react', 'node', 'typescript', 'css'];

    // Check any that are not already checked (seed has playwright + react)
    for (const skill of allSkills) {
      const checkbox = settings.skillCheckbox(skill);
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
      }
    }

    let capturedBody;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/profile')) {
        capturedBody = req.postDataJSON();
      }
    });

    await settings.save();

    // All five checkboxes are checked
    for (const skill of allSkills) {
      await expect(settings.skillCheckbox(skill)).toBeChecked();
    }

    expect(capturedBody.skills).toHaveLength(5);
    for (const skill of allSkills) {
      expect(capturedBody.skills).toContain(skill);
    }

    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-012 | P0 | Positive | AC-6
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-012 [P0] Change digest to "daily" and save — selection persists (AC-6)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    // Pre-condition: seed digest is "weekly"
    // TODO (developer): add data-testid="digest-weekly" to the weekly radio in SettingsPage.jsx
    await expect(settings.digestRadio('weekly')).toBeChecked();

    let capturedBody;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/profile')) {
        capturedBody = req.postDataJSON();
      }
    });

    // TODO (developer): add data-testid="digest-daily" to the daily radio in SettingsPage.jsx
    await settings.selectDigest('daily');
    await expect(settings.digestRadio('daily')).toBeChecked();

    await settings.save();

    expect(capturedBody).toMatchObject({ digest: 'daily' });
    await settings.expectToastVisible('Settings saved');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-013 | P1 | Equivalence | AC-6
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-013 [P1] Each digest option (daily / weekly / never) is selectable (AC-6)', async ({ page, request }) => {
    await reset(request);
    await loginAndGoToSettings(page);

    const settings = new SettingsPage(page);
    await settings.waitForLoaded();

    const digestOptions = ['daily', 'weekly', 'never'];

    // TODO (developer): add data-testid="digest-{freq}" to each radio in SettingsPage.jsx
    for (const freq of digestOptions) {
      await settings.selectDigest(freq);
      await expect(settings.digestRadio(freq)).toBeChecked();
    }
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-014 | P0 | Authorization | AC-8
  // API-only test — no browser page needed
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-014 [P0] Unauthenticated GET /api/profile returns 401 (AC-8)', async ({ request }) => {
    // No Authorization header supplied
    const response = await request.get(`${API_BASE}/api/profile`);

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM6-015 | P0 | Authorization | AC-8
  // -------------------------------------------------------------------------
  test('TC-SCRUM6-015 [P0] Settings page not rendered before login (AC-8)', async ({ page }) => {
    // Navigate to root without logging in
    await page.goto('/');

    // Settings container must be absent
    await expect(page.getByTestId('settings-page')).toHaveCount(0);

    // Login form must be visible
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

});
