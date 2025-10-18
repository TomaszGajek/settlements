/**
 * E2E Test Helpers
 *
 * Utilities for E2E tests including:
 * - Test user authentication
 * - Test data management
 * - Supabase client for test operations
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import { type Page, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E environment variables BEFORE using them
dotenv.config({ path: path.resolve(__dirname, "../../.env.e2e") });

// Initialize Supabase admin client for test operations
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables. Please check your .env.e2e file.");
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user credentials from environment
// Note: Supabase Auth API may reject emails with certain domains (like @example.com, @test.com)
// Use real-looking domains like @gmail.com for E2E tests
export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL,
  password: process.env.E2E_TEST_USER_PASSWORD,
};

/**
 * Login as test user using Playwright page
 * This function fills the login form and submits it
 */
export async function loginAsTestUser(page: Page) {
  // Navigate to login page
  await page.goto("/");

  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Fill in credentials
  await page.getByLabel(/adres email/i).fill(TEST_USER.email);
  await page.getByLabel(/^hasło$/i).fill(TEST_USER.password);

  // Wait for button to be enabled
  const submitButton = page.getByRole("button", { name: /zaloguj/i });
  await submitButton.waitFor({ state: "visible" });
  await expect(submitButton).toBeEnabled({ timeout: 10000 });

  // Submit the form and wait for navigation
  await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()]);

  // Verify we're on the dashboard by checking for a dashboard-specific element
  await page.waitForLoadState("networkidle");

  // Wait for dashboard content to load (summary cards should be visible)
  await page
    .getByText(/przychody|wydatki|bilans/i)
    .first()
    .waitFor({ state: "visible", timeout: 5000 });
}

/**
 * Get test user ID from Supabase
 */
export async function getTestUserId(): Promise<string> {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const testUser = users.users.find((u) => u.email === TEST_USER.email);

  if (!testUser) {
    throw new Error(`Test user ${TEST_USER.email} not found in Supabase. Please create this user first.`);
  }

  return testUser.id;
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}@e2e-test.local`;
}

/**
 * Create a test user and return credentials
 */
export async function createTestUser(email?: string, password = "TestPassword123!") {
  const testEmail = email || generateTestEmail();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: password,
    email_confirm: true, // Auto-confirm email for tests
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return {
    email: testEmail,
    password: password,
    userId: data.user.id,
  };
}

/**
 * Delete a test user by email
 */
export async function deleteTestUser(email: string) {
  // First, find user by email
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error(`Failed to list users: ${listError.message}`);
    return;
  }

  const user = users.users.find((u) => u.email === email);

  if (!user) {
    console.warn(`User ${email} not found, skipping deletion`);
    return;
  }

  // Delete user (this will cascade delete all related data via RLS)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error(`Failed to delete test user: ${deleteError.message}`);
    throw deleteError;
  }
}

/**
 * Clean up all test users (users with @e2e-test.local domain)
 * Use with caution - only call this in test environment
 */
export async function cleanupAllTestUsers() {
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error(`Failed to list users: ${listError.message}`);
    return;
  }

  const testUsers = users.users.filter((u) => u.email?.includes("@e2e-test.local"));

  console.log(`Found ${testUsers.length} test users to clean up`);

  for (const user of testUsers) {
    try {
      // Delete user's transactions first
      await supabaseAdmin.from("transactions").delete().eq("user_id", user.id);

      // Delete user's categories (only deletable ones, skip system categories like "Inne")
      await supabaseAdmin.from("categories").delete().eq("user_id", user.id).eq("is_deletable", true);

      // Finally, delete the user account
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      console.log(`✓ Deleted test user: ${user.email}`);
    } catch (error) {
      console.error(`Failed to delete user ${user.email}:`, error);
    }
  }
}

/**
 * Get default "Inne" category for a user
 */
export async function getDefaultCategory(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("is_deletable", false)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Create a test category for a user
 */
export async function createTestCategory(userId: string, name: string) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      user_id: userId,
      name: name,
      is_deletable: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test category: ${error.message}`);
  }

  return data;
}

/**
 * Create a test transaction for a user
 */
export async function createTestTransaction(
  userId: string,
  categoryId: string,
  amount: number,
  type: "income" | "expense",
  date?: string,
  note?: string
) {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      category_id: categoryId,
      amount: amount,
      type: type,
      date: date || new Date().toISOString().split("T")[0],
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test transaction: ${error.message}`);
  }

  return data;
}

/**
 * Delete all transactions for a user
 */
export async function cleanupUserTransactions(userId: string) {
  const { error } = await supabaseAdmin.from("transactions").delete().eq("user_id", userId);

  if (error) {
    console.error(`Failed to cleanup user transactions: ${error.message}`);
  }
}

/**
 * Delete all categories for a user (except default "Inne")
 */
export async function cleanupUserCategories(userId: string) {
  const { error } = await supabaseAdmin.from("categories").delete().eq("user_id", userId).eq("is_deletable", true);

  if (error) {
    console.error(`Failed to cleanup user categories: ${error.message}`);
  }
}
