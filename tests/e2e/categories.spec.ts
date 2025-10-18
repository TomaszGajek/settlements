/**
 * Testy E2E - zarządzanie kategoriami
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../setup/e2e-helpers";

test.describe("Category Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto("/settings");
  });

  test("should display all default categories", async ({ page }) => {
    await expect(page.getByTestId("category-item-jedzenie")).toBeVisible();
    await expect(page.getByTestId("category-item-rachunki")).toBeVisible();
    await expect(page.getByTestId("category-item-wynagrodzenie")).toBeVisible();
    await expect(page.getByTestId("category-item-rozrywka")).toBeVisible();
    await expect(page.getByTestId("category-item-inne")).toBeVisible();
  });

  test("should validate category name length", async ({ page }) => {
    await page.getByTestId("add-category-button").click();
    const input = page.getByTestId("category-name-input");

    await input.fill("a".repeat(100));

    await expect(input).toHaveValue("a".repeat(100));
    await expect(page.getByTestId("category-modal-submit")).not.toBeDisabled();
    await expect(page.getByText("100/100")).toBeVisible();
  });
});
