/**
 * Global Setup - Project Dependencies Approach
 * 
 * This file is used by Playwright's project dependencies feature.
 * It wraps the existing global-setup logic as a test.
 */

import { test as setup } from "@playwright/test";
import globalSetupLogic from "./setup/global-setup.js";

setup("initialize test environment", async () => {
  await globalSetupLogic();
});

