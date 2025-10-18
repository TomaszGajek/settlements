/**
 * Page Object Model - Dashboard
 * Zgodnie z wytycznymi Playwright
 */

import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly fabButton: Locator;
  readonly logoutButton: Locator;
  readonly incomeCard: Locator;
  readonly expensesCard: Locator;
  readonly balanceCard: Locator;
  readonly transactionsList: Locator;
  readonly monthNavigation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fabButton = page.getByRole('button', { name: /dodaj transakcję/i });
    this.logoutButton = page.getByRole('button', { name: /wyloguj/i });
    this.incomeCard = page.getByTestId('income-card');
    this.expensesCard = page.getByTestId('expenses-card');
    this.balanceCard = page.getByTestId('balance-card');
    this.transactionsList = page.getByTestId('transactions-list');
    this.monthNavigation = page.getByTestId('month-navigation');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async openTransactionModal() {
    await this.fabButton.click();
  }

  async logout() {
    await this.logoutButton.click();
  }

  async getIncomeAmount() {
    return await this.incomeCard.textContent();
  }

  async getExpensesAmount() {
    return await this.expensesCard.textContent();
  }

  async getBalanceAmount() {
    return await this.balanceCard.textContent();
  }

  async navigateToPreviousMonth() {
    await this.monthNavigation.getByRole('button', { name: /poprzedni/i }).click();
  }

  async navigateToNextMonth() {
    await this.monthNavigation.getByRole('button', { name: /następny/i }).click();
  }
}

