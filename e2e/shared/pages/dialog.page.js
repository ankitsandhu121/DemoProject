// Confirmation dialog + toast component page object.
// Centralizes the reusable Modal (apps/web/src/components/Modal.jsx) and
// Toast (apps/web/src/components/Toast.jsx) so specs don't re-derive the
// Cancel fallback or the toast auto-dismiss assertion.
//
// data-testid sources:
//   modal-overlay → Modal.jsx:7
//   modal         → Modal.jsx:8  (role "dialog", aria-modal, aria-label = title)
//   modal-title   → Modal.jsx:9
//   modal-confirm → Modal.jsx:18 (label is the confirmLabel prop, e.g. "Remove")
//   toast         → Toast.jsx:15 (role "status", auto-dismiss after duration, default 3000ms)
//
// First-class fallbacks (per source-grounded-locators step 3):
//   - Cancel button: no data-testid (Modal.jsx:14-17, intentional). Scoped to the
//     modal by role/name so it cannot collide with page-level buttons:
//       getByTestId('modal').getByRole('button', { name: 'Cancel' })
//   - Message paragraph: no data-testid (<p class="modal-message">, Modal.jsx:12).
//     Asserted via modal-scoped text.
//
// TODO (developer): add data-testid="modal-cancel" to the Cancel button in
//   apps/web/src/components/Modal.jsx (line 14-17) so the cancel control is id-backed
//   instead of role/name-scoped. Do NOT edit app source from the test layer.
// TODO (developer): add data-testid="modal-message" to <p class="modal-message">
//   (Modal.jsx:12) so message text assertions are id-backed instead of text-scoped.

'use strict';

const { expect } = require('@playwright/test');

class DialogPage {
  constructor(page) {
    this.page = page;
    this.dialog = page.getByTestId('modal');
    this.overlay = page.getByTestId('modal-overlay');
    this.title = page.getByTestId('modal-title');
    this.confirmButton = page.getByTestId('modal-confirm');
    // Fallback: Cancel has no data-testid — scope role/name to the modal (see header TODO).
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.toast = page.getByTestId('toast');
  }

  /** The dialog reached by accessible role/name (aria-label = modal title). */
  dialogByRole(name) {
    return this.page.getByRole('dialog', { name });
  }

  /** Toast reached by accessible role (role="status"). */
  toastByRole() {
    return this.page.getByRole('status');
  }

  /** Fallback: message paragraph has no data-testid — assert via modal-scoped text. */
  message(text) {
    return this.dialog.getByText(text);
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden();
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  /** Toast appears with the expected text. */
  async expectToast(text) {
    await expect(this.toast).toBeVisible();
    await expect(this.toast).toHaveText(text);
  }

  /** Toast is gone from the DOM (auto-dismiss after duration, default 3000ms). */
  async expectToastDismissed() {
    await expect(this.toast).toHaveCount(0, { timeout: 6000 });
  }

  /** Toast never appeared (e.g. after cancelling). */
  async expectNoToast() {
    await expect(this.toast).toHaveCount(0);
  }
}

module.exports = { DialogPage };
