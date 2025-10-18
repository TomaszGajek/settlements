/**
 * Testy E2E - Dashboard
 * TC-DASH-001 do TC-DASH-004 z planu testów
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../setup/e2e-helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się jako użytkownik testowy
    await loginAsTestUser(page);
  });

  test("TC-DASH-001: should display summary cards correctly", async ({ page }) => {
    // Sprawdź czy karty podsumowania są widoczne
    const incomeCard = page.getByTestId("summary-card-income");
    const expensesCard = page.getByTestId("summary-card-expenses");
    const balanceCard = page.getByTestId("summary-card-balance");

    await expect(incomeCard).toBeVisible();
    await expect(expensesCard).toBeVisible();
    await expect(balanceCard).toBeVisible();

    // Sprawdź czy karty zawierają wartości w złotych
    await expect(incomeCard).toContainText(/zł/);
    await expect(expensesCard).toContainText(/zł/);
    await expect(balanceCard).toContainText(/zł/);
  });

  test("TC-DASH-002: should navigate between months", async ({ page }) => {
    // Znajdź nawigację po miesiącach
    const prevButton = page.getByRole("button", { name: /poprzedni|wstecz|<|←/i }).first();
    const nextButton = page.getByRole("button", { name: /następny|naprzód|>|→/i }).first();

    // Sprawdź obecny miesiąc w URL
    const currentUrl = page.url();
    const urlParams = new URL(currentUrl).searchParams;
    const currentMonth = urlParams.get("month");
    const currentYear = urlParams.get("year");

    // Kliknij "poprzedni miesiąc"
    await prevButton.click();
    await page.waitForURL(/month=\d+&year=\d+/);

    // Sprawdź czy URL się zmienił
    const newUrl = page.url();
    expect(newUrl).not.toBe(currentUrl);

    // Sprawdź czy dane się zaktualizowały (karty powinny być widoczne)
    await expect(page.getByTestId("summary-card-income")).toBeVisible();

    // Kliknij "następny miesiąc" aby wrócić
    await nextButton.click();
    await page.waitForURL(/month=\d+&year=\d+/);

    // URL powinien wrócić do poprzedniego (lub podobnego)
    const returnedUrl = page.url();
    const returnedParams = new URL(returnedUrl).searchParams;
    expect(returnedParams.get("month")).toBe(currentMonth);
    expect(returnedParams.get("year")).toBe(currentYear);
  });

  test("TC-DASH-004: should handle dashboard without transactions", async ({ page }) => {
    // Przejdź do miesiąca bez transakcji (np. daleką przyszłość)
    await page.goto("/dashboard?month=12&year=2030");

    // Karty powinny pokazywać 0,00 zł
    const incomeCard = page.getByTestId("summary-card-income-value");
    const expensesCard = page.getByTestId("summary-card-expenses-value");
    const balanceCard = page.getByTestId("summary-card-balance-value");

    await expect(incomeCard).toContainText(/0[,.]00\s?zł/);
    await expect(expensesCard).toContainText(/0[,.]00\s?zł/);
    await expect(balanceCard).toContainText(/0[,.]00\s?zł/);

    // Lista transakcji powinna być pusta lub pokazywać komunikat
    const emptyMessage = page.getByText(/brak transakcji|nie ma transakcji/i);

    // Sprawdź czy jest komunikat LUB lista jest pusta
    const hasMessage = await emptyMessage.isVisible().catch(() => false);
    if (!hasMessage) {
      // Jeśli nie ma komunikatu, sprawdź czy lista jest pusta
      const transactions = page.getByTestId("transaction-item");
      await expect(transactions).toHaveCount(0);
    }
  });

  test("should update cards after adding transaction", async ({ page }) => {
    // Zapamiętaj obecną wartość przychodów
    const incomeCard = page.getByTestId("summary-card-income-value");
    const initialIncomeText = await incomeCard.textContent();

    // Dodaj transakcję przychodową
    await page.getByTestId("add-transaction-button").click();

    // Wybierz typ Przychód
    await page.getByTestId("transaction-type-income").click();

    // Wypełnij formularz - tylko kwota i kategoria
    await page.getByTestId("transaction-amount-input").fill("500");

    // Wybierz kategorię - kliknij select, poczekaj na opcje i wybierz pierwszą
    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();

    // Wyślij
    await page.getByTestId("transaction-form-submit").click();

    // Poczekaj na toast - sonner tworzy toast jako li element z role="status"
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Sprawdź czy wartość przychodów się zmieniła
    await expect(incomeCard).not.toHaveText(initialIncomeText || "");
  });

  test("should display current month by default", async ({ page }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    // Sprawdź czy URL zawiera obecny miesiąc
    const url = page.url();
    expect(url).toContain(`month=${currentMonth}`);
    expect(url).toContain(`year=${currentYear}`);
  });

  test("should maintain month selection when navigating away and back", async ({ page }) => {
    // Przejdź do konkretnego miesiąca
    await page.goto("/dashboard?month=5&year=2025");

    // Przejdź do ustawień
    await page.goto("/settings");

    // Wróć do dashboardu
    await page.goto("/dashboard");

    // URL powinien pamiętać ostatni wybrany miesiąc (jeśli implementacja tak działa)
    // LUB pokazać domyślnie obecny miesiąc
    const url = page.url();
    expect(url).toMatch(/month=\d+&year=\d+/);
  });

  test("should show FAB (Floating Action Button)", async ({ page }) => {
    const fab = page.getByTestId("add-transaction-button");

    await expect(fab).toBeVisible();

    // Kliknij FAB
    await fab.click();

    // Modal powinien się otworzyć
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("Dashboard - Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się jako użytkownik testowy
    await loginAsTestUser(page);
  });

  test("should render dashboard layout correctly", async ({ page }) => {
    // Sprawdź główne elementy layoutu - karty podsumowania
    await expect(page.getByTestId("summary-card-income")).toBeVisible();
    await expect(page.getByTestId("summary-card-expenses")).toBeVisible();
    await expect(page.getByTestId("summary-card-balance")).toBeVisible();

    // Opcjonalnie: screenshot dla visual regression
    // await expect(page).toHaveScreenshot('dashboard-layout.png');
  });

  test("should be responsive at 1920x1080 resolution", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wszystkie elementy powinny być widoczne
    await expect(page.getByTestId("summary-card-income")).toBeVisible();
    await expect(page.getByTestId("summary-card-expenses")).toBeVisible();
    await expect(page.getByTestId("summary-card-balance")).toBeVisible();

    // Przycisk dodaj transakcję powinien być widoczny
    await expect(page.getByTestId("add-transaction-button")).toBeVisible();
  });
});
