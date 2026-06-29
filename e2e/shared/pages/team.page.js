// Team page object — locators grounded in apps/web/src/pages/TeamPage.jsx
//
// data-testid sources (line numbers reference TeamPage.jsx):
//   team-page          → TeamPage.jsx:25
//   member-list        → TeamPage.jsx:28
//   member-row-{id}    → TeamPage.jsx:30 (rendered via members.map, TeamPage.jsx:29)
//   member-name-{id}   → TeamPage.jsx:31
//   member-remove-{id} → TeamPage.jsx:34
//
// The confirmation modal and toast are reusable components composed by this page;
// their locators/actions live in dialog.page.js (DialogPage) — this page object
// does NOT re-declare them. Use a DialogPage instance for confirm/cancel/toast.
//
// IMPORTANT: the app keeps the auth token in React in-memory state (App.jsx).
// Reach /team via client-side NavBar navigation (NavBar.navigateTo('team')),
// not page.goto('/team'), or the SPA bounces back to login.

'use strict';

const { expect } = require('@playwright/test');

class TeamPage {
  constructor(page) {
    this.page = page;
    this.teamPage = page.getByTestId('team-page');
    this.memberList = page.getByTestId('member-list');
  }

  memberRow(id) {
    return this.page.getByTestId(`member-row-${id}`);
  }

  memberName(id) {
    return this.page.getByTestId(`member-name-${id}`);
  }

  memberRemove(id) {
    return this.page.getByTestId(`member-remove-${id}`);
  }

  async waitForLoaded() {
    await expect(this.teamPage).toBeVisible();
    await expect(this.memberList).toBeVisible();
  }

  /** Clicks the Remove button for a member, which opens the confirmation modal. */
  async openRemove(id) {
    await this.memberRemove(id).click();
  }
}

module.exports = { TeamPage };
