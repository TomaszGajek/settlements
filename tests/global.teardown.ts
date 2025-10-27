/**
 * Global Teardown - Clean Up Database After All Tests
 *
 * This script runs after all E2E tests complete and cleans up:
 * - All test users (users with @e2e-test.local domain) - DELETED completely
 * - Main test user's data - transactions and user-created categories DELETED, but user account KEPT
 * - This ensures a clean state for the next test run while avoiding user recreation overhead
 *
 * This ensures a clean state for the next test run.
 */

import { test as teardown } from "@playwright/test";
import { supabaseAdmin, getTestUserId } from "./setup/e2e-helpers.js";

teardown("clean up test database", async () => {
  try {
    // Get all users from the database
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    // Filter test users (those with @e2e-test.local domain)
    const testUsers = users.users.filter((u) => u.email?.includes("@e2e-test.local"));

    if (testUsers.length === 0) {
      return;
    }

    // Delete each test user
    // Note: This will cascade delete all related data (transactions, categories)
    // due to foreign key constraints in the database
    for (const user of testUsers) {
      try {
        // Delete user's transactions first
        await supabaseAdmin.from("transactions").delete().eq("user_id", user.id);

        // Delete user's categories (only deletable ones, skip system categories like "Inne")
        await supabaseAdmin.from("categories").delete().eq("user_id", user.id).eq("is_deletable", true);

        // Finally, delete the user account
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      } catch {
        // Silent error handling
      }
    }

    // Clean up main test user's data (but keep the user account)
    try {
      const mainUserId = await getTestUserId();

      // Delete main user's transactions
      await supabaseAdmin.from("transactions").delete().eq("user_id", mainUserId);

      // Delete main user's custom categories (keep default ones)
      await supabaseAdmin.from("categories").delete().eq("user_id", mainUserId).eq("is_deletable", true);
    } catch {
      // Silent error handling
    }
  } catch {
    // Don't throw - we don't want to fail the entire test suite if cleanup fails
  }
});
