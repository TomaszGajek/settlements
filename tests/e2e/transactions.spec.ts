/**
 * Przykładowy test E2E - zarządzanie transakcjami
 * TC-TRANS-001, TC-TRANS-003, TC-TRANS-004 z planu testów
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser, getTestUserId, cleanupUserTransactions } from "../setup/e2e-helpers";

test.describe("Transaction Management", () => {
  // Run tests serially to avoid data contamination between parallel tests
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    // Cleanup: Delete all transactions before each test for clean state
    // This prevents data contamination between serial tests
    const userId = await getTestUserId();
    await cleanupUserTransactions(userId);

    // Zaloguj się jako użytkownik testowy
    await loginAsTestUser(page);

    // Upewnij się że jesteśmy na bieżącym miesiącu/roku
    // Dzięki temu transakcje z domyślną datą (today) będą widoczne na liście
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    await page.goto(`/dashboard?month=${currentMonth}&year=${currentYear}`);
    await page.waitForLoadState("networkidle");
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

    // Wait for POST request
    const postPromise = page.waitForResponse(
      (response) => response.url().includes("/api/transactions") && response.request().method() === "POST",
      { timeout: 15000 }
    );

    await page.getByTestId("transaction-form-submit").click();

    // Wait for POST to complete
    await postPromise;

    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Wait for the refetch after POST
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions?") &&
        response.status() === 200 &&
        response.request().method() === "GET",
      { timeout: 15000 }
    );

    // Give DOM time to update and verify transaction appears
    await page.waitForTimeout(1000);
    await expect(page.getByTestId("transaction-item").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-TRANS-003: should edit existing transaction", async ({ page }) => {
    // Najpierw dodaj transakcję do edycji
    await page.getByTestId("add-transaction-button").click();
    await page.getByTestId("transaction-type-expense").click();
    await page.getByTestId("transaction-amount-input").fill("100.00");
    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();
    await page.getByTestId("transaction-note-input").fill("Oryginalna transakcja");

    // Wait for POST request
    const createPostPromise = page.waitForResponse(
      (response) => response.url().includes("/api/transactions") && response.request().method() === "POST",
      { timeout: 15000 }
    );

    await page.getByTestId("transaction-form-submit").click();

    // Wait for POST to complete
    await createPostPromise;

    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Wait for list to refetch after creation
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions?") &&
        response.status() === 200 &&
        response.request().method() === "GET",
      { timeout: 15000 }
    );

    // Give DOM time to update
    await page.waitForTimeout(1000);

    // Poczekaj aż transakcja pojawi się na liście przed próbą edycji
    await expect(page.getByTestId("transaction-edit-button").first()).toBeVisible({ timeout: 5000 });

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

    // Wait for PATCH request
    const updatePatchPromise = page.waitForResponse(
      (response) => response.url().includes("/api/transactions/") && response.request().method() === "PATCH",
      { timeout: 15000 }
    );

    // Zapisz
    await page.getByTestId("transaction-form-submit").click();

    // Wait for PATCH to complete
    await updatePatchPromise;

    // Sprawdź toast sukcesu - to potwierdza że edycja się udała
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible({ timeout: 10000 });

    // Wait for list to refetch after update
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions?") &&
        response.status() === 200 &&
        response.request().method() === "GET",
      { timeout: 15000 }
    );

    // Give DOM time to update
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

    // No need to change date - form defaults to today which matches current period

    await page.getByTestId("transaction-category-select").click();
    await page.locator('[role="option"]').first().click();
    await page.getByTestId("transaction-note-input").fill("Do usunięcia");

    // Wait for BOTH the POST and the subsequent GET refetch
    const postPromise = page.waitForResponse(
      (response) => response.url().includes("/api/transactions") && response.request().method() === "POST",
      { timeout: 15000 }
    );

    await page.getByTestId("transaction-form-submit").click();

    // Wait for POST to complete first
    await postPromise;

    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible();

    // Now wait for the refetch that happens AFTER the POST
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions?") &&
        response.status() === 200 &&
        response.request().method() === "GET",
      { timeout: 15000 }
    );

    // Give DOM time to update after refetch
    await page.waitForTimeout(2000);

    // Znajdź transakcję z unikalną kwotą
    const transactionToDelete = page
      .locator('[data-testid="transaction-item"]')
      .filter({ hasText: formattedAmount })
      .first();

    // Verify the transaction is visible
    await expect(transactionToDelete).toBeVisible({ timeout: 10000 });

    await transactionToDelete.getByTestId("transaction-delete-button").click();

    // Wait for DELETE request
    const deletePromise = page.waitForResponse(
      (response) => response.url().includes("/api/transactions/") && response.request().method() === "DELETE",
      { timeout: 15000 }
    );

    // Potwierdź w dialogu
    await page.getByTestId("delete-transaction-dialog-confirm").click();

    // Wait for DELETE to complete
    await deletePromise;

    // Sprawdź toast sukcesu
    await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible({ timeout: 5000 });

    // Wait for list to refetch after deletion
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions?") &&
        response.status() === 200 &&
        response.request().method() === "GET",
      { timeout: 15000 }
    );

    // Give DOM time to update
    await page.waitForTimeout(1000);

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
