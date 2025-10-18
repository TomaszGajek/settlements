/**
 * Page Object Model - Strona logowania
 * Zgodnie z wytycznymi Playwright
 */

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerTab: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/hasło/i);
    this.loginButton = page.getByRole('button', { name: /zaloguj/i });
    this.registerTab = page.getByRole('tab', { name: /rejestracja/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: RegExp) {
    await this.errorMessage.filter({ hasText: message }).waitFor();
  }

  async switchToRegister() {
    await this.registerTab.click();
  }
}

