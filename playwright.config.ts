import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.e2e") });

/**
 * Konfiguracja Playwright dla testów E2E
 * Zgodnie z wytycznymi: tylko Chromium/Desktop Chrome
 *
 * Zmienne środowiskowe wczytywane z .env.e2e:
 * - PUBLIC_SUPABASE_URL: URL projektu testowego Supabase
 * - PUBLIC_SUPABASE_ANON_KEY: Anon key projektu testowego
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (do czyszczenia danych)
 * - BASE_URL: URL aplikacji (domyślnie http://localhost:4321)
 */
export default defineConfig({
  // Katalog z testami E2E
  testDir: "./tests/e2e",

  // Maksymalny czas na jeden test
  timeout: 30 * 1000,

  // Konfiguracja expect
  expect: {
    timeout: 5000,
  },

  // Uruchamiaj testy równolegle
  fullyParallel: true,

  // Powtórz testy tylko gdy nie działają
  retries: process.env.CI ? 2 : 0,

  // Liczba workerów
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],

  // Współdzielone ustawienia dla wszystkich projektów
  use: {
    // URL bazowy aplikacji
    baseURL: process.env.BASE_URL || "http://localhost:4322",

    // Trace przy niepowodzeniu
    trace: "on-first-retry",

    // Screenshot przy niepowodzeniu
    screenshot: "only-on-failure",

    // Video przy niepowodzeniu
    video: "retain-on-failure",

    // Viewport
    viewport: { width: 1920, height: 1080 },

    // Locale i timezone
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",

    // Pass environment variables to tests
    extraHTTPHeaders: {
      "x-test-env": "e2e",
    },
  },

  // Projekty - tylko Chromium zgodnie z wytycznymi
  projects: [
    // Setup project - runs before all tests
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "teardown",
    },
    // Teardown project - runs after all tests
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },
    // Main test project
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ["setup"],
    },
  ],

  // Serwer deweloperski - uruchom przed testami jeśli nie działa
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:4322",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Override with E2E test database credentials
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || "",
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || "",
    },
  },

  // Output
  outputDir: "playwright-results",
});
