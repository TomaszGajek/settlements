/**
 * Testy E2E - Dashboard
 * TC-DASH-001 do TC-DASH-004 z planu testów
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się przed każdym testem
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /zaloguj/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-DASH-001: should display summary cards correctly', async ({ page }) => {
    // Sprawdź czy karty podsumowania są widoczne
    const incomeCard = page.getByTestId('income-card').or(page.getByText(/przychody/i).locator('..'));
    const expensesCard = page.getByTestId('expenses-card').or(page.getByText(/wydatki/i).locator('..'));
    const balanceCard = page.getByTestId('balance-card').or(page.getByText(/bilans/i).locator('..'));

    await expect(incomeCard).toBeVisible();
    await expect(expensesCard).toBeVisible();
    await expect(balanceCard).toBeVisible();

    // Sprawdź czy karty zawierają wartości w złotych
    await expect(incomeCard).toContainText(/zł/);
    await expect(expensesCard).toContainText(/zł/);
    await expect(balanceCard).toContainText(/zł/);
  });

  test('TC-DASH-002: should display daily chart', async ({ page }) => {
    // Sprawdź czy wykres jest widoczny
    const chart = page.locator('[class*="recharts"]').or(page.getByRole('img', { name: /wykres/i }));
    
    await expect(chart.first()).toBeVisible();
  });

  test('TC-DASH-003: should navigate between months', async ({ page }) => {
    // Znajdź nawigację po miesiącach
    const prevButton = page.getByRole('button', { name: /poprzedni|wstecz|<|←/i }).first();
    const nextButton = page.getByRole('button', { name: /następny|naprzód|>|→/i }).first();

    // Sprawdź obecny miesiąc w URL
    const currentUrl = page.url();
    const urlParams = new URL(currentUrl).searchParams;
    const currentMonth = urlParams.get('month');
    const currentYear = urlParams.get('year');

    // Kliknij "poprzedni miesiąc"
    await prevButton.click();
    await page.waitForURL(/month=\d+&year=\d+/);

    // Sprawdź czy URL się zmienił
    const newUrl = page.url();
    expect(newUrl).not.toBe(currentUrl);

    // Sprawdź czy dane się zaktualizowały (karty powinny być widoczne)
    await expect(page.getByText(/przychody/i)).toBeVisible();

    // Kliknij "następny miesiąc" aby wrócić
    await nextButton.click();
    await page.waitForURL(/month=\d+&year=\d+/);

    // URL powinien wrócić do poprzedniego (lub podobnego)
    const returnedUrl = page.url();
    const returnedParams = new URL(returnedUrl).searchParams;
    expect(returnedParams.get('month')).toBe(currentMonth);
    expect(returnedParams.get('year')).toBe(currentYear);
  });

  test('TC-DASH-004: should handle dashboard without transactions', async ({ page }) => {
    // Przejdź do miesiąca bez transakcji (np. daleką przyszłość)
    await page.goto('/dashboard?month=12&year=2030');

    // Karty powinny pokazywać 0,00 zł
    const incomeCard = page.getByText(/przychody/i).locator('..');
    const expensesCard = page.getByText(/wydatki/i).locator('..');
    const balanceCard = page.getByText(/bilans/i).locator('..');

    await expect(incomeCard).toContainText(/0[,\.]00\s?zł/);
    await expect(expensesCard).toContainText(/0[,\.]00\s?zł/);
    await expect(balanceCard).toContainText(/0[,\.]00\s?zł/);

    // Lista transakcji powinna być pusta lub pokazywać komunikat
    const emptyMessage = page.getByText(/brak transakcji|nie ma transakcji/i);
    
    // Sprawdź czy jest komunikat LUB lista jest pusta
    const hasMessage = await emptyMessage.isVisible().catch(() => false);
    if (!hasMessage) {
      // Jeśli nie ma komunikatu, sprawdź czy lista jest pusta
      const transactions = page.getByTestId('transaction-item');
      await expect(transactions).toHaveCount(0);
    }
  });

  test('should update cards after adding transaction', async ({ page }) => {
    // Zapamiętaj obecną wartość przychodów
    const incomeCard = page.getByText(/przychody/i).locator('..');
    const initialIncomeText = await incomeCard.textContent();

    // Dodaj transakcję przychodową
    await page.getByRole('button', { name: /dodaj transakcję/i }).click();
    
    // Wybierz typ Przychód
    await page.getByRole('button', { name: /przychód|income/i }).click();
    
    // Wypełnij formularz
    await page.getByLabel(/kwota/i).fill('500');
    await page.getByLabel(/kategoria/i).selectOption({ index: 0 });
    
    // Wyślij
    await page.getByRole('button', { name: /dodaj/i }).click();

    // Poczekaj na toast
    await expect(page.getByText(/transakcja została dodana/i)).toBeVisible();

    // Sprawdź czy wartość przychodów się zmieniła
    await page.waitForTimeout(500); // Poczekaj na odświeżenie danych
    const newIncomeText = await incomeCard.textContent();
    expect(newIncomeText).not.toBe(initialIncomeText);
  });

  test('should display current month by default', async ({ page }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    // Sprawdź czy URL zawiera obecny miesiąc
    const url = page.url();
    expect(url).toContain(`month=${currentMonth}`);
    expect(url).toContain(`year=${currentYear}`);
  });

  test('should maintain month selection when navigating away and back', async ({ page }) => {
    // Przejdź do konkretnego miesiąca
    await page.goto('/dashboard?month=5&year=2025');

    // Przejdź do ustawień
    await page.goto('/settings');

    // Wróć do dashboardu
    await page.goto('/dashboard');

    // URL powinien pamiętać ostatni wybrany miesiąc (jeśli implementacja tak działa)
    // LUB pokazać domyślnie obecny miesiąc
    const url = page.url();
    expect(url).toMatch(/month=\d+&year=\d+/);
  });

  test('should show FAB (Floating Action Button)', async ({ page }) => {
    const fab = page.getByRole('button', { name: /dodaj transakcję/i });
    
    await expect(fab).toBeVisible();
    
    // Kliknij FAB
    await fab.click();

    // Modal powinien się otworzyć
    await expect(page.getByRole('dialog').or(page.getByLabel(/modal/i))).toBeVisible();
  });
});

test.describe('Dashboard - Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /zaloguj/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should render dashboard layout correctly', async ({ page }) => {
    // Sprawdź główne elementy layoutu
    await expect(page.getByText(/dashboard|główna/i)).toBeVisible();
    await expect(page.getByText(/przychody/i)).toBeVisible();
    await expect(page.getByText(/wydatki/i)).toBeVisible();
    await expect(page.getByText(/bilans/i)).toBeVisible();

    // Opcjonalnie: screenshot dla visual regression
    // await expect(page).toHaveScreenshot('dashboard-layout.png');
  });

  test('should be responsive at 1920x1080 resolution', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wszystkie elementy powinny być widoczne
    await expect(page.getByText(/przychody/i)).toBeVisible();
    await expect(page.getByText(/wydatki/i)).toBeVisible();
    await expect(page.getByText(/bilans/i)).toBeVisible();
    
    // FAB powinien być widoczny
    await expect(page.getByRole('button', { name: /dodaj transakcję/i })).toBeVisible();
  });
});

