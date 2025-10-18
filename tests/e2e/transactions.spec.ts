/**
 * Przykładowy test E2E - zarządzanie transakcjami
 * TC-TRANS-001, TC-TRANS-003, TC-TRANS-004 z planu testów
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../setup/e2e-helpers";

test.describe("Transaction Management", () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się jako użytkownik testowy
    await loginAsTestUser(page);
  });

  test("TC-TRANS-001: should add new transaction (expense)", async ({ page }) => {
    // Kliknij FAB (Floating Action Button)
    await page.getByTestId("add-transaction-button").click();

    // Wybierz typ: Wydatek
    await page.getByTestId("transaction-type-expense").click();

    // Wypełnij formularz
    await page.getByTestId("transaction-amount-input").fill("150.50");

    // Wybierz kategorię
    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();
    await page.getByTestId("transaction-note-input").fill("Zakupy spożywcze");
    await page.getByTestId("transaction-form-submit").click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();
  });

  test("TC-TRANS-003: should edit existing transaction", async ({ page }) => {
    // Najpierw dodaj transakcję do edycji
    await page.getByTestId("add-transaction-button").click();
    await page.getByTestId("transaction-type-expense").click();
    await page.getByTestId("transaction-amount-input").fill("100.00");
    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();
    await page.getByTestId("transaction-note-input").fill("Oryginalna transakcja");
    await page.getByTestId("transaction-form-submit").click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Poczekaj aż modal się zamknie
    await page.waitForTimeout(500);

    // Teraz znajdź transakcję i kliknij edycję
    await page.getByTestId("transaction-edit-button").first().click();

    // Zmień kwotę
    const amountInput = page.getByTestId("transaction-amount-input");
    await amountInput.clear();
    await amountInput.fill("200.00");

    // Zmień notatkę
    const noteInput = page.getByTestId("transaction-note-input");
    await noteInput.clear();
    await noteInput.fill("Zaktualizowane zakupy");

    // Zapisz
    await page.getByTestId("transaction-form-submit").click();

    // Sprawdź toast sukcesu - to potwierdza że edycja się udała
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible({ timeout: 10000 });

    // Poczekaj na zamknięcie modala
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // Sprawdź czy transakcje są widoczne na liście (weryfikacja że lista się załadowała)
    await expect(page.getByTestId("transaction-item").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-TRANS-004: should delete transaction", async ({ page }) => {
    // Najpierw dodaj transakcję do usunięcia
    await page.getByTestId("add-transaction-button").click();
    await page.getByTestId("transaction-type-expense").click();
    await page.getByTestId("transaction-amount-input").fill("50.00");
    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();
    await page.getByTestId("transaction-note-input").fill("Do usunięcia");
    await page.getByTestId("transaction-form-submit").click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Poczekaj aż modal się zamknie
    await page.waitForTimeout(500);

    // Policz transakcje przed usunięciem
    const transactionsBefore = await page.getByTestId("transaction-item").count();

    // Kliknij przycisk usunięcia przy pierwszej transakcji
    await page.getByTestId("transaction-delete-button").first().click();

    // Potwierdź w dialogu
    await page.getByTestId("delete-transaction-dialog-confirm").click();

    // Sprawdź toast
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Poczekaj aż lista się zaktualizuje - oczekuj że liczba transakcji się zmieni
    await page.waitForFunction(
      (expectedCount) => {
        const items = document.querySelectorAll('[data-testid="transaction-item"]');
        return items.length === expectedCount;
      },
      transactionsBefore - 1,
      { timeout: 5000 }
    );

    // Sprawdź czy transakcji ubyło
    const transactionsAfter = await page.getByTestId("transaction-item").count();
    expect(transactionsAfter).toBe(transactionsBefore - 1);
  });

  test("TC-TRANS-005: should load more transactions on scroll", async ({ page }) => {
    // Ten test wymaga więcej niż 20 transakcji aby przetestować infinite scroll
    // W praktyce po global teardown baza jest czysta, więc test prawie zawsze będzie pomijany
    const initialCount = await page.getByTestId("transaction-item").count();

    // Pomiń test jeśli nie ma dokładnie 20 transakcji (co oznacza że jest następna strona)
    // lub jeśli jest mniej niż 20 (brak danych do infinite scroll)
    if (initialCount !== 20) {
      test.skip();
      return;
    }

    // Poczekaj na załadowanie listy
    const transactionsList = page.getByTestId("transactions-list");
    await transactionsList.waitFor({ state: "visible", timeout: 5000 });

    // Przewiń do końca listy
    await transactionsList.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Poczekaj na załadowanie nowych transakcji (IntersectionObserver + API call)
    await page.waitForTimeout(2000);

    // Sprawdź czy załadowano więcej transakcji LUB pojawił się komunikat "To wszystkie transakcje"
    const newCount = await page.getByTestId("transaction-item").count();
    const endMessage = page.getByText("To wszystkie transakcje");
    const hasEndMessage = await endMessage.isVisible().catch(() => false);

    // Jeśli załadowano więcej - test pass
    // Jeśli pojawił się komunikat końca - też pass (infinite scroll działał ale nie ma więcej danych)
    expect(newCount > initialCount || hasEndMessage).toBe(true);
  });
});
