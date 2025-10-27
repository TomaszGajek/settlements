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
    throw new Error("Missing required environment variables");
  }

  // Ensure test user exists
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const testUser = users?.users.find((u) => u.email === TEST_USER.email);

  if (!testUser) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }
  }
}

export default globalSetup;
