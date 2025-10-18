/**
 * Przykładowy test E2E - autentykacja użytkownika
 * TC-AUTH-001, TC-AUTH-002, TC-AUTH-005 z planu testów
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser, TEST_USER } from "../setup/e2e-helpers";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("TC-AUTH-002: should login with correct credentials", async ({ page }) => {
    // Użyj helpera do logowania
    await loginAsTestUser(page);

    // Sprawdź przekierowanie do dashboardu
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("TC-AUTH-003: should show error with incorrect credentials", async ({ page }) => {
    // Poczekaj na pełną hydratację strony
    await page.waitForLoadState("networkidle");

    // Wypełnij formularz z błędnymi danymi (użyj tego samego email ale złe hasło)
    await page.getByLabel(/adres email/i).fill(TEST_USER.email);
    await page.getByLabel(/^hasło$/i).fill("WrongPassword123!");

    // Poczekaj aż przycisk stanie się aktywny (form validation)
    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });

    // Wyślij formularz
    await submitButton.click();

    // Sprawdź komunikat o błędzie w alercie formularza (nie w toaście)
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(/nieprawidłowy email lub hasło/i);

    // Sprawdź brak przekierowania
    await expect(page).toHaveURL("/");
  });

  test("TC-AUTH-004: should enable login button when form is valid", async ({ page }) => {
    // Poczekaj na pełną hydratację strony
    await page.waitForLoadState("networkidle");

    // Znajdź przycisk logowania
    const submitButton = page.getByRole("button", { name: /zaloguj/i });

    // Początkowo przycisk powinien być wyłączony (puste pola)
    await expect(submitButton).toBeDisabled();

    // Wypełnij email
    await page.getByLabel(/adres email/i).fill(TEST_USER.email);

    // Przycisk nadal wyłączony (brak hasła)
    await expect(submitButton).toBeDisabled();

    // Wypełnij hasło - użyj getByLabel zamiast getByRole dla password input
    await page.getByLabel(/^hasło$/i).fill(TEST_USER.password);

    // Poczekaj chwilę na walidację formularza
    await page.waitForTimeout(300);

    // Teraz przycisk powinien być aktywny
    await expect(submitButton).toBeEnabled();
  });

  test("TC-AUTH-006: should redirect to login when accessing protected route", async ({ page }) => {
    // Próbuj dostać się do chronionej trasy
    await page.goto("/dashboard");

    // Sprawdź przekierowanie do strony logowania
    await expect(page).toHaveURL(/\/\?reason=session_expired/);

    // Sprawdź komunikat
    await expect(page.getByText(/sesja wygasła/i)).toBeVisible();
  });
});

test.describe("Logout Flow", () => {
  test("TC-AUTH-005: should logout user and redirect to home", async ({ page }) => {
    // Zaloguj się jako użytkownik testowy
    await loginAsTestUser(page);

    // Poczekaj na załadowanie dashboardu
    await expect(page).toHaveURL(/\/dashboard/);

    // Wyloguj się
    await page.getByRole("button", { name: /wyloguj/i }).click();

    // Sprawdź przekierowanie
    await expect(page).toHaveURL("/");

    // Sprawdź że nie można dostać się do dashboardu
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/\?reason=session_expired/);
  });
});
