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
      ],
      // Minimum 80% pokrycia dla logiki biznesowej
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
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
