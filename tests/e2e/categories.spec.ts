/**
 * Testy E2E - zarządzanie kategoriami
 * TC-CAT-001 do TC-CAT-006 z planu testów
 */

import { test, expect } from '@playwright/test';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się przed każdym testem
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /zaloguj/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Przejdź do ustawień
    await page.goto('/settings');
  });

  test('TC-CAT-001: should add new category', async ({ page }) => {
    // Kliknij przycisk dodawania kategorii
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();

    // Wypełnij formularz
    await page.getByLabel(/nazwa/i).fill('Transport');

    // Wyślij formularz
    await page.getByRole('button', { name: /^dodaj$/i }).click();

    // Sprawdź toast z potwierdzeniem
    await expect(page.getByText(/kategoria została dodana/i)).toBeVisible();

    // Sprawdź czy kategoria pojawia się na liście
    await expect(page.getByText('Transport')).toBeVisible();

    // Sprawdź czy kategoria jest dostępna w dashboardzie
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /dodaj transakcję/i }).click();
    await page.getByLabel(/kategoria/i).click();
    await expect(page.getByRole('option', { name: /transport/i })).toBeVisible();
  });

  test('TC-CAT-002: should reject duplicate category name', async ({ page }) => {
    // Dodaj pierwszą kategorię
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();
    await page.getByLabel(/nazwa/i).fill('Zdrowie');
    await page.getByRole('button', { name: /^dodaj$/i }).click();
    await expect(page.getByText(/kategoria została dodana/i)).toBeVisible();

    // Poczekaj aż modal się zamknie
    await page.waitForTimeout(500);

    // Próbuj dodać kategorię o tej samej nazwie
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();
    await page.getByLabel(/nazwa/i).fill('Zdrowie');
    await page.getByRole('button', { name: /^dodaj$/i }).click();

    // Sprawdź komunikat o błędzie
    await expect(page.getByText(/kategoria o tej nazwie już istnieje/i)).toBeVisible();
  });

  test('TC-CAT-003: should reject reserved name "Inne"', async ({ page }) => {
    // Próbuj dodać kategorię o nazwie "Inne"
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();
    await page.getByLabel(/nazwa/i).fill('Inne');

    // Sprawdź walidację
    await expect(page.getByText(/nie można użyć nazwy.*inne.*zarezerwowana/i)).toBeVisible();

    // Przycisk powinien być nieaktywny
    const addButton = page.getByRole('button', { name: /^dodaj$/i });
    await expect(addButton).toBeDisabled();
  });

  test('TC-CAT-004: should edit existing category', async ({ page }) => {
    // Dodaj kategorię do edycji
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();
    await page.getByLabel(/nazwa/i).fill('Sport');
    await page.getByRole('button', { name: /^dodaj$/i }).click();
    await expect(page.getByText(/kategoria została dodana/i)).toBeVisible();

    // Poczekaj aż modal się zamknie
    await page.waitForTimeout(500);

    // Znajdź kategorię Sport i kliknij edycję
    const sportCategory = page.getByText('Sport').locator('..').locator('..');
    await sportCategory.getByRole('button', { name: /edytuj/i }).click();

    // Zmień nazwę
    const nameInput = page.getByLabel(/nazwa/i);
    await nameInput.clear();
    await nameInput.fill('Sport i rekreacja');

    // Zapisz
    await page.getByRole('button', { name: /zapisz/i }).click();

    // Sprawdź toast
    await expect(page.getByText(/kategoria została zaktualizowana/i)).toBeVisible();

    // Sprawdź nową nazwę na liście
    await expect(page.getByText('Sport i rekreacja')).toBeVisible();
    await expect(page.getByText('Sport').and(page.locator(':not(:has-text("rekreacja")))'))).not.toBeVisible();
  });

  test('TC-CAT-005: should delete category and reassign transactions', async ({ page }) => {
    // Przejdź do dashboardu i dodaj transakcję z kategorią do usunięcia
    await page.goto('/dashboard');
    
    // Dodaj kategorię testową
    await page.goto('/settings');
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();
    await page.getByLabel(/nazwa/i).fill('Testowa Kategoria');
    await page.getByRole('button', { name: /^dodaj$/i }).click();
    await expect(page.getByText(/kategoria została dodana/i)).toBeVisible();
    await page.waitForTimeout(500);

    // Dodaj transakcję z tą kategorią
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /dodaj transakcję/i }).click();
    await page.getByLabel(/kwota/i).fill('100');
    await page.getByLabel(/kategoria/i).selectOption('Testowa Kategoria');
    await page.getByLabel(/notatka/i).fill('Transakcja do przepięcia');
    await page.getByRole('button', { name: /dodaj/i }).click();
    
    // Poczekaj na potwierdzenie
    await expect(page.getByText(/transakcja została dodana/i)).toBeVisible();

    // Wróć do ustawień i usuń kategorię
    await page.goto('/settings');
    const categoryToDelete = page.getByText('Testowa Kategoria').locator('..').locator('..');
    await categoryToDelete.getByRole('button', { name: /usuń/i }).click();

    // Potwierdź usunięcie w dialogu
    await page.getByRole('button', { name: /potwierdź|usuń/i }).click();

    // Sprawdź toast
    await expect(page.getByText(/kategoria została usunięta/i)).toBeVisible();

    // Sprawdź czy kategoria zniknęła z listy
    await expect(page.getByText('Testowa Kategoria')).not.toBeVisible();

    // Sprawdź czy transakcja nadal istnieje z kategorią "Inne"
    await page.goto('/dashboard');
    await expect(page.getByText('Transakcja do przepięcia')).toBeVisible();
    
    // Sprawdź czy transakcja ma kategorię "Inne"
    const transaction = page.getByText('Transakcja do przepięcia').locator('..').locator('..');
    await expect(transaction.getByText('Inne')).toBeVisible();
  });

  test('TC-CAT-006: should not allow deleting system category "Inne"', async ({ page }) => {
    // Znajdź kategorię "Inne"
    const inneCategory = page.getByText(/^Inne$/).locator('..').locator('..');

    // Przycisk usuwania powinien być niewidoczny lub nieaktywny
    const deleteButton = inneCategory.getByRole('button', { name: /usuń/i });
    
    // Sprawdź czy przycisk jest niewidoczny LUB nieaktywny
    const isVisible = await deleteButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(deleteButton).toBeDisabled();
    } else {
      await expect(deleteButton).not.toBeVisible();
    }
  });

  test('should display all default categories', async ({ page }) => {
    // Sprawdź czy wszystkie domyślne kategorie są widoczne
    await expect(page.getByText('Jedzenie')).toBeVisible();
    await expect(page.getByText('Rachunki')).toBeVisible();
    await expect(page.getByText('Wynagrodzenie')).toBeVisible();
    await expect(page.getByText('Rozrywka')).toBeVisible();
    await expect(page.getByText('Inne')).toBeVisible();
  });

  test('should validate category name length', async ({ page }) => {
    // Próbuj dodać kategorię z bardzo długą nazwą (>100 znaków)
    await page.getByRole('button', { name: /dodaj kategorię/i }).click();
    await page.getByLabel(/nazwa/i).fill('a'.repeat(101));

    // Sprawdź komunikat walidacji
    await expect(page.getByText(/maksymalnie 100 znaków/i)).toBeVisible();

    // Przycisk dodawania powinien być nieaktywny
    await expect(page.getByRole('button', { name: /^dodaj$/i })).toBeDisabled();
  });
});

