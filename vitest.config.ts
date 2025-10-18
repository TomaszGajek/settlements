import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Środowisko testowe - jsdom dla testów React
    environment: "jsdom",

    // Pliki setup wykonywane przed testami
    setupFiles: ["./tests/setup/vitest.setup.ts"],

    // Globalne ustawienia
    globals: true,

    // Pokrycie kodu
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "*.config.*",
        "dist/",
        ".astro/",
        "src/db/database.types.ts",
        "src/env.d.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        // Exclude UI components (tested via E2E)
        "src/components/**/*.{tsx,astro}",
        // Exclude layouts (tested via E2E)
        "src/layouts/**/*.astro",
        // Exclude pages (tested via E2E)
        "src/pages/**/*.{ts,astro}",
        // Exclude middleware (tested via E2E)
        "src/middleware/**/*.ts",
        // Exclude database client wrappers
        "src/db/supabase.*.ts",
        // Exclude types (no logic to test)
        "src/types.ts",
        "src/lib/types/**/*.ts",
        // Exclude React hooks that wrap API calls (tested via integration tests)
        "src/lib/hooks/**/*.{ts,tsx}",
        // Exclude contexts (tested via integration tests)
        "src/lib/contexts/**/*.tsx",
      ],
      // Focus on business logic: services, utils, schemas
      // These directories should have 80%+ coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Dopasowanie plików testowych
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],

    // Timeout dla testów
    testTimeout: 10000,
    hookTimeout: 10000,

    // Izolacja między testami
    isolate: true,

    // Clearowanie mocków między testami
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },

  // Rozwiązywanie aliasów zgodnie z tsconfig
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
