// Settings page object — locators grounded in apps/web/src/pages/SettingsPage.jsx
//
// data-testid sources (line numbers reference SettingsPage.jsx):
//   settings-page        → SettingsPage.jsx:47
//   settings-loading     → SettingsPage.jsx:19
//   settings-name-input  → SettingsPage.jsx:54
//   settings-avatar-input→ SettingsPage.jsx:63
//   settings-avatar-name → SettingsPage.jsx:66
//   settings-date-input  → SettingsPage.jsx:72
//   settings-role-select → SettingsPage.jsx:80
//   settings-skills      → SettingsPage.jsx:91
//   skill-{skill}        → SettingsPage.jsx:97  (dynamic: `skill-${skill}`)
//   settings-digest      → SettingsPage.jsx:106
//   settings-save        → SettingsPage.jsx:123
//   toast                → Toast.jsx:15
//
// TODO (developer): Digest radio inputs inside SettingsPage.jsx:108 have no data-testid.
// Add data-testid={`digest-${freq}`} to each radio <input> so tests can use
// getByTestId('digest-daily') etc. instead of the role/name fallback below.

'use strict';

const { expect } = require('@playwright/test');
const { DialogPage } = require('./dialog.page');

class SettingsPage {
  constructor(page) {
    this.page = page;

    // Page-level
    this.settingsPage = page.getByTestId('settings-page');
    this.loadingIndicator = page.getByTestId('settings-loading');

    // Form fields
    this.nameInput = page.getByTestId('settings-name-input');
    this.avatarInput = page.getByTestId('settings-avatar-input');
    this.avatarName = page.getByTestId('settings-avatar-name');
    this.dateInput = page.getByTestId('settings-date-input');
    this.roleSelect = page.getByTestId('settings-role-select');

    // Fieldsets
    this.skillsFieldset = page.getByTestId('settings-skills');
    this.digestFieldset = page.getByTestId('settings-digest');

    // Actions
    this.saveButton = page.getByTestId('settings-save');

    // Toast — reuse the shared Toast component locator (single source of truth)
    // rather than re-declaring getByTestId('toast') here. The Toast component
    // (apps/web/src/components/Toast.jsx) is centralized in DialogPage.
    this.toast = new DialogPage(page).toast;
  }

  async goto() {
    await this.page.goto('/settings');
  }

  async waitForLoaded() {
    // Use an explicit timeout longer than the config default (3000ms) because this
    // assertion waits for a full page navigation + GET /api/profile to complete.
    await expect(this.settingsPage).toBeVisible({ timeout: 10000 });
  }

  /** Returns the checkbox locator for a named skill. */
  skillCheckbox(skill) {
    return this.page.getByTestId(`skill-${skill}`);
  }

  /**
   * Returns the radio locator for a digest frequency.
   * TODO (developer): add data-testid="digest-{freq}" to each radio <input>
   * in SettingsPage.jsx so this can be replaced with getByTestId(`digest-${freq}`).
   */
  digestRadio(freq) {
    return this.digestFieldset.getByRole('radio', { name: new RegExp(freq, 'i') });
  }

  async updateName(name) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async selectRole(role) {
    await this.roleSelect.selectOption(role);
  }

  async toggleSkill(skill) {
    await this.skillCheckbox(skill).click();
  }

  async selectDigest(freq) {
    await this.digestRadio(freq).click();
  }

  async save() {
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/profile') && resp.request().method() === 'PUT'
    );
    await this.saveButton.click();
    await responsePromise;
  }

  async expectToastVisible(text = 'Settings saved') {
    await expect(this.toast).toBeVisible();
    await expect(this.toast).toContainText(text);
  }

  /**
   * Selects a file in the avatar input. Upload fires on selection via
   * handleAvatar (SettingsPage.jsx:32-37), NOT on Save — so the POST is
   * triggered by setInputFiles. Returns the POST /api/profile/avatar response
   * promise so callers can assert status / request body (e.g. AC-2).
   *
   * The 10000ms timeout intentionally exceeds the config default action timeout
   * because it spans a real network round-trip.
   */
  async uploadAvatar(filePath) {
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/profile/avatar') && resp.request().method() === 'POST',
      { timeout: 10000 }
    );
    await this.avatarInput.setInputFiles(filePath);
    return responsePromise;
  }

  /** Asserts the conditionally-rendered chosen-filename span (SettingsPage.jsx:66). */
  async expectAvatarName(name) {
    await expect(this.avatarName).toBeVisible();
    await expect(this.avatarName).toHaveText(name);
  }
}

module.exports = { SettingsPage };
