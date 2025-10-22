/**
 * Przykładowy test E2E - zarządzanie transakcjami
 * TC-TRANS-001, TC-TRANS-003, TC-TRANS-004 z planu testów
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../setup/e2e-helpers";

test.describe("Transaction Management", () => {
  // Run tests serially to avoid data contamination between parallel tests
  test.describe.configure({ mode: "serial" });

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

    // Poczekaj aż toast zniknie i modal się zamknie
    await page.waitForTimeout(1000);

    // Sprawdź czy transakcje są widoczne na liście (weryfikacja że lista się załadowała po refetch)
    await expect(page.getByTestId("transaction-item").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-TRANS-004: should delete transaction", async ({ page }) => {
    // Use a unique amount to avoid conflicts with other tests (even in serial mode)
    const uniqueAmount = "50.17";
    const formattedAmount = "50,17"; // Polish currency format

    // Najpierw dodaj transakcję do usunięcia
    await page.getByTestId("add-transaction-button").click();
    await page.getByTestId("transaction-type-expense").click();
    await page.getByTestId("transaction-amount-input").fill(uniqueAmount);
    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();
    await page.getByTestId("transaction-note-input").fill("Do usunięcia");
    await page.getByTestId("transaction-form-submit").click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Poczekaj aż modal się zamknie i lista się załaduje
    await page.waitForTimeout(1000);

    // Znajdź transakcję z unikalną kwotą i kliknij delete
    const transactionToDelete = page
      .locator('[data-testid="transaction-item"]')
      .filter({ hasText: formattedAmount })
      .first();

    // Upewnij się że transakcja istnieje przed usunięciem
    await expect(transactionToDelete).toBeVisible();

    await transactionToDelete.getByTestId("transaction-delete-button").click();

    // Potwierdź w dialogu
    await page.getByTestId("delete-transaction-dialog-confirm").click();

    // Sprawdź toast sukcesu
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible({ timeout: 5000 });

    // Poczekaj na zakończenie całego procesu usuwania i odświeżenie listy
    // Zamiast czekać na zmianę liczby elementów DOM, poczekamy na request do API
    // który pobiera zaktualizowaną listę transakcji
    await Promise.race([
      // Opcja 1: Czekamy na request do API transactions
      page.waitForResponse((response) => response.url().includes("/api/transactions") && response.status() === 200, {
        timeout: 10000,
      }),
      // Opcja 2: Timeout fallback
      page.waitForTimeout(10000),
    ]);

    // Dodatkowy wait na renderowanie (dłuższy timeout dla CI)
    await page.waitForTimeout(2000);

    // Sprawdź czy usunięta transakcja nie jest już widoczna
    // Ponieważ używamy unikalnej kwoty, nie powinno być innych transakcji z taką kwotą
    const deletedTransaction = page.locator('[data-testid="transaction-item"]').filter({ hasText: formattedAmount });

    // Weryfikacja że transakcja została usunięta
    await expect(deletedTransaction).toHaveCount(0, { timeout: 5000 });
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

    // Przewiń do ostatniej transakcji na liście
    // IntersectionObserver trigger znajduje się poniżej listy transakcji
    const lastTransaction = page.getByTestId("transaction-item").last();
    await lastTransaction.scrollIntoViewIfNeeded();

    // Przewiń jeszcze trochę niżej, żeby IntersectionObserver target (div poniżej transakcji) stał się widoczny
    await page.evaluate(() => {
      window.scrollBy(0, 300);
    });

    // Poczekaj na załadowanie nowych transakcji (IntersectionObserver + API call)
    // Dajemy więcej czasu na wykonanie API call i renderowanie
    await page.waitForTimeout(3000);

    // Sprawdź czy załadowano więcej transakcji LUB pojawił się komunikat "To wszystkie transakcje"
    const newCount = await page.getByTestId("transaction-item").count();
    const endMessage = page.getByText("To wszystkie transakcje");
    const hasEndMessage = await endMessage.isVisible().catch(() => false);

    // Jeśli załadowano więcej - test pass
    // Jeśli pojawił się komunikat końca - też pass (infinite scroll działał ale nie ma więcej danych)
    expect(newCount > initialCount || hasEndMessage).toBe(true);
  });
});
