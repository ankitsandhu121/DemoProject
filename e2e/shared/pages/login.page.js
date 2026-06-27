// Login page object — locators grounded in apps/web/src/components/LoginForm.jsx
// data-testid sources:
//   login-email-input    → LoginForm.jsx:34
//   login-password-input → LoginForm.jsx:43
//   login-submit-button  → LoginForm.jsx:54
//   login-error          → LoginForm.jsx:50

const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible();
  }
}

module.exports = { LoginPage };
