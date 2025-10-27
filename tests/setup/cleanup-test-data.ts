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
  // Safety check - ensure we're not running against production
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    process.exit(1);
  }

  try {
    await cleanupAllTestUsers();
  } catch {
    process.exit(1);
  }
}

main();
