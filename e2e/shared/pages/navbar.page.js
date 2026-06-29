// NavBar component page object — locators grounded in apps/web/src/components/NavBar.jsx
//
// data-testid sources (line numbers reference NavBar.jsx):
//   navbar        → NavBar.jsx:15
//   nav-tasks     → NavBar.jsx:5  (link list, rendered via .map at NavBar.jsx:18-28)
//   nav-projects  → NavBar.jsx:6
//   nav-team      → NavBar.jsx:7
//   nav-settings  → NavBar.jsx:8
//
// Why this object exists: several specs duplicated inline `getByTestId('nav-settings')`
// clicks. This shared component object centralizes NavBar navigation.
//
// IMPORTANT: the app keeps the auth token in React in-memory state (App.jsx useState).
// A hard navigation (page.goto) reloads the SPA, destroys that state, and bounces the
// user back to the login form. Always use these client-side NavLink clicks to move
// between authenticated routes so React state survives.
//
// TODO (developer): the NavBar "Log out" button (NavBar.jsx:31) has no data-testid;
// it is intentionally exercised via a role/name fallback. Not needed by SCRUM-10.

'use strict';

const SECTIONS = ['tasks', 'projects', 'team', 'settings'];

class NavBar {
  constructor(page) {
    this.page = page;
    this.navbar = page.getByTestId('navbar');
  }

  /** Returns the NavLink locator for a section (e.g. 'settings' → nav-settings). */
  link(section) {
    return this.page.getByTestId(`nav-${section}`);
  }

  /** Client-side navigation to a NavBar section, preserving React auth state. */
  async navigateTo(section) {
    if (!SECTIONS.includes(section)) {
      throw new Error(`Unknown NavBar section "${section}". Expected one of: ${SECTIONS.join(', ')}`);
    }
    await this.link(section).click();
  }

  async gotoSettings() {
    await this.navigateTo('settings');
  }
}

module.exports = { NavBar };
