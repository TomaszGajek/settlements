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
import { supabaseAdmin, TEST_USER, getTestUserId } from "./setup/e2e-helpers.js";

teardown("clean up test database", async () => {
  console.log("\n🧹 Starting database cleanup...\n");

  try {
    // Get all users from the database
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Failed to list users:", listError.message);
      throw listError;
    }

    // Filter test users (those with @e2e-test.local domain)
    const testUsers = users.users.filter((u) => u.email?.includes("@e2e-test.local"));

    console.log(`📊 Found ${testUsers.length} temporary test users to delete completely`);

    if (testUsers.length === 0) {
      console.log("✅ No test users to clean up\n");
      return;
    }

    // Delete each test user
    // Note: This will cascade delete all related data (transactions, categories)
    // due to foreign key constraints in the database
    let successCount = 0;
    let errorCount = 0;

    for (const user of testUsers) {
      try {
        // Delete user's transactions first
        const { error: transactionsError } = await supabaseAdmin.from("transactions").delete().eq("user_id", user.id);

        if (transactionsError) {
          console.warn(`⚠️  Failed to delete transactions for ${user.email}:`, transactionsError.message);
        }

        // Delete user's categories (only deletable ones, skip system categories like "Inne")
        const { error: categoriesError } = await supabaseAdmin
          .from("categories")
          .delete()
          .eq("user_id", user.id)
          .eq("is_deletable", true);

        if (categoriesError) {
          console.warn(`⚠️  Failed to delete categories for ${user.email}:`, categoriesError.message);
        }

        // Finally, delete the user account
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error(`❌ Failed to delete user ${user.email}:`, deleteError.message);
          errorCount++;
        } else {
          console.log(`   ✓ Deleted test user: ${user.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error deleting user ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📈 Temporary Users Cleanup Summary:`);
    console.log(`   - Successfully deleted: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`   - Failed to delete: ${errorCount} users`);
    }

    // Clean up main test user's data (but keep the user account)
    console.log(`\n🧼 Cleaning up main test user's data...`);
    try {
      const mainUserId = await getTestUserId();

      // Delete main user's transactions
      const { error: mainTransactionsError } = await supabaseAdmin
        .from("transactions")
        .delete()
        .eq("user_id", mainUserId);

      if (mainTransactionsError) {
        console.warn(`⚠️  Failed to delete main user's transactions:`, mainTransactionsError.message);
      } else {
        console.log(`   ✓ Deleted main user's transactions`);
      }

      // Delete main user's custom categories (keep default ones)
      const { error: mainCategoriesError } = await supabaseAdmin
        .from("categories")
        .delete()
        .eq("user_id", mainUserId)
        .eq("is_deletable", true);

      if (mainCategoriesError) {
        console.warn(`⚠️  Failed to delete main user's categories:`, mainCategoriesError.message);
      } else {
        console.log(`   ✓ Deleted main user's custom categories (kept defaults)`);
      }

      console.log(`   ✓ Main test user account preserved: ${TEST_USER.email}`);
    } catch (error) {
      console.warn("⚠️  Failed to clean up main test user's data:", error);
    }

    console.log("\n✅ Database cleanup completed!\n");
  } catch (error) {
    console.error("❌ Unexpected error during cleanup:", error);
    // Don't throw - we don't want to fail the entire test suite if cleanup fails
  }
});
