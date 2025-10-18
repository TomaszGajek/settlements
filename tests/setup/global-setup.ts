/**
 * Global setup for E2E tests
 * Runs once before all tests
 *
 * This script:
 * - Validates test environment configuration
 * - Ensures test database is accessible
 * - Creates test user if it doesn't exist
 * - Optionally cleans up test data from previous runs
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { supabaseAdmin, TEST_USER } from "./e2e-helpers.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env.e2e") });

async function globalSetup() {
  console.log("\n🚀 Starting E2E test suite...\n");

  // Validate environment variables
  const requiredEnvVars = [
    "PUBLIC_SUPABASE_URL",
    "PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "E2E_TEST_USER_EMAIL",
    "E2E_TEST_USER_PASSWORD",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables in .env.e2e:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\nPlease copy .env.e2e.example to .env.e2e and fill in your test Supabase project credentials.\n");
    throw new Error("Missing required environment variables");
  }

  // Log configuration (without sensitive data)
  console.log("✅ Test environment configuration validated");
  console.log(`   - Supabase URL: ${process.env.PUBLIC_SUPABASE_URL}`);
  console.log(`   - Base URL: ${process.env.BASE_URL}`);
  console.log(`   - Test User: ${process.env.E2E_TEST_USER_EMAIL}`);
  console.log("");

  // Ensure test user exists
  try {
    console.log("🔍 Checking if test user exists...");
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_USER.email);

    if (!testUser) {
      console.log("👤 Creating test user...");
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true,
      });

      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }

      console.log(`✅ Test user created: ${TEST_USER.email}`);
    } else {
      console.log(`✅ Test user exists: ${TEST_USER.email}`);
    }
  } catch (error) {
    console.error("❌ Failed to setup test user:", error);
    throw error;
  }

  console.log("");
}

export default globalSetup;
