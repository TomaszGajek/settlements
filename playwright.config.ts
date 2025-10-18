import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla testów E2E
 * Zgodnie z wytycznymi: tylko Chromium/Desktop Chrome
 */
export default defineConfig({
  // Katalog z testami E2E
  testDir: './tests/e2e',
  
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
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  
  // Współdzielone ustawienia dla wszystkich projektów
  use: {
    // URL bazowy aplikacji
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    
    // Trace przy niepowodzeniu
    trace: 'on-first-retry',
    
    // Screenshot przy niepowodzeniu
    screenshot: 'only-on-failure',
    
    // Video przy niepowodzeniu
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
    
    // Locale i timezone
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
  },
  
  // Projekty - tylko Chromium zgodnie z wytycznymi
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  
  // Serwer deweloperski - uruchom przed testami jeśli nie działa
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Output
  outputDir: 'playwright-results',
});

