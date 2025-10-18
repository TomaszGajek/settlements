/**
 * Przykładowy test E2E - autentykacja użytkownika
 * TC-AUTH-001, TC-AUTH-002, TC-AUTH-005 z planu testów
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-AUTH-001: should register new user and redirect to dashboard', async ({ page }) => {
    // Przejdź do zakładki Rejestracja
    await page.getByRole('tab', { name: /rejestracja/i }).click();

    // Wypełnij formularz
    const testEmail = `test-${Date.now()}@example.com`;
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/hasło/i).first().fill('TestPassword123!');

    // Wyślij formularz
    await page.getByRole('button', { name: /zarejestruj/i }).click();

    // Sprawdź przekierowanie do dashboardu
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Opcjonalnie: sprawdź czy dashboard się załadował
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('TC-AUTH-002: should login with correct credentials', async ({ page }) => {
    // Wypełnij formularz logowania
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('TestPassword123!');

    // Wyślij formularz
    await page.getByRole('button', { name: /zaloguj/i }).click();

    // Sprawdź przekierowanie do dashboardu
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-AUTH-003: should show error with incorrect credentials', async ({ page }) => {
    // Wypełnij formularz z błędnymi danymi
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('WrongPassword123!');

    // Wyślij formularz
    await page.getByRole('button', { name: /zaloguj/i }).click();

    // Sprawdź komunikat o błędzie
    await expect(page.getByText(/nieprawidłowy email lub hasło/i)).toBeVisible();
    
    // Sprawdź brak przekierowania
    await expect(page).toHaveURL('/');
  });

  test('TC-AUTH-006: should redirect to login when accessing protected route', async ({ page }) => {
    // Próbuj dostać się do chronionej trasy
    await page.goto('/dashboard');

    // Sprawdź przekierowanie do strony logowania
    await expect(page).toHaveURL(/\/\?reason=session_expired/);
    
    // Sprawdź komunikat
    await expect(page.getByText(/sesja wygasła/i)).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test('TC-AUTH-005: should logout user and redirect to home', async ({ page }) => {
    // Najpierw zaloguj się
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/hasło/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /zaloguj/i }).click();
    
    // Poczekaj na załadowanie dashboardu
    await expect(page).toHaveURL(/\/dashboard/);

    // Wyloguj się
    await page.getByRole('button', { name: /wyloguj/i }).click();

    // Sprawdź przekierowanie
    await expect(page).toHaveURL('/');

    // Sprawdź że nie można dostać się do dashboardu
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/\?reason=session_expired/);
  });
});

