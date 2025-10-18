# Dokumentacja Testów - Settlements

## Struktura katalogów

```
tests/
├── setup/              # Pliki konfiguracyjne i setup
│   ├── vitest.setup.ts      # Setup dla Vitest
│   └── msw.setup.ts         # Setup dla Mock Service Worker
├── utils/              # Narzędzia pomocnicze
│   ├── test-utils.tsx       # Custom render, helpers
│   └── msw-handlers.ts      # Mock Service Worker handlers
├── mocks/              # Dane mock dla testów
├── unit/               # Testy jednostkowe
│   ├── schemas/             # Walidacja schematów Zod
│   ├── utils/               # Funkcje pomocnicze
│   └── hooks/               # Hooki React
├── integration/        # Testy integracyjne
│   ├── components/          # Komponenty React z API
│   └── api/                 # Endpointy API
└── e2e/                # Testy E2E (Playwright)
    ├── page-objects/        # Page Object Model
    ├── auth.spec.ts         # Testy autentykacji
    ├── transactions.spec.ts # Testy transakcji
    ├── categories.spec.ts   # Testy kategorii
    └── dashboard.spec.ts    # Testy dashboardu
```

## Uruchamianie testów

### Testy jednostkowe i integracyjne (Vitest)

```bash
# Uruchom wszystkie testy jednostkowe i integracyjne
npm test

# Uruchom w trybie watch
npm run test:watch

# Uruchom z interfejsem UI
npm run test:ui

# Uruchom z pokryciem kodu
npm run test:coverage

# Uruchom tylko testy jednostkowe
npm run test:unit

# Uruchom tylko testy integracyjne
npm run test:integration
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom z interfejsem UI
npm run test:e2e:ui

# Uruchom w trybie headed (widoczna przeglądarka)
npm run test:e2e:headed

# Uruchom w trybie debug
npm run test:e2e:debug

# Otwórz raport z testów
npm run test:e2e:report

# Nagraj nowe testy (codegen)
npm run test:e2e:codegen
```

### Wszystkie testy

```bash
# Uruchom wszystkie typy testów
npm run test:all
```

## Pisanie testów

### Testy jednostkowe (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature name', () => {
  it('should do something', () => {
    // Arrange - przygotuj dane
    const input = 'test';
    
    // Act - wykonaj akcję
    const result = functionToTest(input);
    
    // Assert - sprawdź wynik
    expect(result).toBe('expected');
  });
});
```

### Testy komponentów React

```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Testy E2E (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('should do something', async ({ page }) => {
    // Nawigacja
    await page.goto('/');
    
    // Interakcja
    await page.getByRole('button', { name: 'Click me' }).click();
    
    // Asercja
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Testy z Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';
import { DashboardPage } from './page-objects/DashboardPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
  
  await expect(page).toHaveURL(/dashboard/);
  await expect(dashboardPage.incomeCard).toBeVisible();
});
```

## Best Practices

### Testy jednostkowe

- ✅ Testuj jedną rzecz na raz
- ✅ Używaj opisowych nazw testów
- ✅ Stosuj wzorzec AAA (Arrange-Act-Assert)
- ✅ Mockuj zależności zewnętrzne
- ✅ Dąż do 80% pokrycia kodu logiki biznesowej

### Testy integracyjne

- ✅ Testuj interakcje między komponentami
- ✅ Używaj MSW do mockowania API
- ✅ Testuj rzeczywiste scenariusze użytkownika
- ✅ Sprawdzaj komunikaty błędów

### Testy E2E

- ✅ Testuj kluczowe ścieżki użytkownika
- ✅ Używaj Page Object Model dla czytelności
- ✅ Używaj `data-testid` dla elementów testowych
- ✅ Unikaj twardego kodowania timeoutów
- ✅ Sprawdzaj wizualne zmiany z `toHaveScreenshot()`

## Debugowanie

### Vitest

```bash
# Uruchom konkretny test
npm test -- transaction.test.ts

# Uruchom testy z konkretnym pattern
npm test -- -t "should validate"

# Uruchom UI mode do debugowania
npm run test:ui
```

### Playwright

```bash
# Uruchom w trybie debug
npm run test:e2e:debug

# Uruchom konkretny test
npm run test:e2e -- auth.spec.ts

# Zobacz trace
npx playwright show-trace trace.zip
```

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions przy każdym push i pull request.

Konfiguracja znajduje się w `.github/workflows/test.yml`.

## Pokrycie kodu

Minimalne progi pokrycia (ustawione w `vitest.config.ts`):

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Cel: **80%** dla logiki biznesowej.

## Przydatne linki

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Plan testów](../.ai/test-plan.md)

