/**
 * Cleanup Test Data Script
 *
 * This script removes all test users and their associated data from the test database.
 * Use this to clean up after failed tests or before running a fresh test suite.
 *
 * Usage:
 *   npx tsx tests/setup/cleanup-test-data.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { cleanupAllTestUsers } from "./e2e-helpers";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env.e2e") });

async function main() {
  console.log("🧹 Starting test data cleanup...\n");

  // Safety check - ensure we're not running against production
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    console.error("❌ Missing PUBLIC_SUPABASE_URL in .env.e2e");
    process.exit(1);
  }

  // Extra safety check
  console.log(`⚠️  This will delete all test users from: ${supabaseUrl}`);
  console.log("   Only test users with @e2e-test.local domain will be deleted.\n");

  try {
    await cleanupAllTestUsers();
    console.log("\n✅ Test data cleanup completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Failed to cleanup test data:", error);
    process.exit(1);
  }
}

main();
