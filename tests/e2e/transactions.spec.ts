/**
 * Przykładowy test E2E - zarządzanie transakcjami
 * TC-TRANS-001, TC-TRANS-003, TC-TRANS-004 z planu testów
 */

import { test, expect } from '@playwright/test';

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się przed każdym testem
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /zaloguj/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-TRANS-001: should add new transaction (expense)', async ({ page }) => {
    // Kliknij FAB (Floating Action Button)
    await page.getByRole('button', { name: /dodaj transakcję/i }).click();

    // Wybierz typ: Wydatek
    await page.getByRole('button', { name: /wydatek/i }).click();

    // Wypełnij formularz
    await page.getByLabel(/kwota/i).fill('150.50');
    await page.getByLabel(/data/i).fill('2025-10-15');
    await page.getByLabel(/kategoria/i).selectOption('Jedzenie');
    await page.getByLabel(/notatka/i).fill('Zakupy spożywcze');

    // Wyślij formularz
    await page.getByRole('button', { name: /^dodaj$/i }).click();

    // Sprawdź toast z potwierdzeniem
    await expect(page.getByText(/transakcja została dodana/i)).toBeVisible();

    // Sprawdź czy transakcja pojawia się na liście
    await expect(page.getByText('Zakupy spożywcze')).toBeVisible();
    await expect(page.getByText('150,50 zł')).toBeVisible();
  });

  test('TC-TRANS-003: should edit existing transaction', async ({ page }) => {
    // Znajdź transakcję i kliknij edycję (załóżmy że istnieje)
    await page.getByRole('button', { name: /edytuj/i }).first().click();

    // Zmień kwotę
    const amountInput = page.getByLabel(/kwota/i);
    await amountInput.clear();
    await amountInput.fill('200.00');

    // Zmień notatkę
    const noteInput = page.getByLabel(/notatka/i);
    await noteInput.clear();
    await noteInput.fill('Zaktualizowane zakupy');

    // Zapisz
    await page.getByRole('button', { name: /zapisz/i }).click();

    // Sprawdź toast
    await expect(page.getByText(/transakcja została zaktualizowana/i)).toBeVisible();

    // Sprawdź zmiany na liście
    await expect(page.getByText('Zaktualizowane zakupy')).toBeVisible();
    await expect(page.getByText('200,00 zł')).toBeVisible();
  });

  test('TC-TRANS-004: should delete transaction', async ({ page }) => {
    // Policz transakcje przed usunięciem
    const transactionsBefore = await page.getByTestId('transaction-item').count();

    // Kliknij przycisk usunięcia przy pierwszej transakcji
    await page.getByRole('button', { name: /usuń/i }).first().click();

    // Potwierdź w dialogu
    await page.getByRole('button', { name: /potwierdź/i }).click();

    // Sprawdź toast
    await expect(page.getByText(/transakcja została usunięta/i)).toBeVisible();

    // Sprawdź czy transakcji ubyło
    const transactionsAfter = await page.getByTestId('transaction-item').count();
    expect(transactionsAfter).toBe(transactionsBefore - 1);
  });

  test('TC-TRANS-005: should load more transactions on scroll', async ({ page }) => {
    // Sprawdź początkową liczbę transakcji (20)
    const initialCount = await page.getByTestId('transaction-item').count();
    expect(initialCount).toBeLessThanOrEqual(20);

    // Przewiń do końca listy
    await page.getByTestId('transactions-list').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Poczekaj na załadowanie nowych transakcji
    await page.waitForTimeout(1000);

    // Sprawdź czy załadowano więcej
    const newCount = await page.getByTestId('transaction-item').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});

