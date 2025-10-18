# Tech Stack

## Frontend - Astro z React dla komponentów interaktywnych

- **Astro 5**: Pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript.
- **React 19**: Zapewni interaktywność tam, gdzie jest potrzebna.
- **TypeScript 5**: Dla statycznego typowania kodu i lepszego wsparcia IDE.
- **Tailwind 4**: Pozwala na wygodne stylowanie aplikacji.
- **Shadcn/ui**: Zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI.

## Backend - Supabase jako kompleksowe rozwiązanie backendowe

- Zapewnia bazę danych PostgreSQL.
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service.
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze.
- Posiada wbudowaną autentykację użytkowników.

## Testing - Kompleksowe pokrycie testami

### Testy jednostkowe i integracyjne

- **Vitest**: Szybki framework testowy dla TypeScript, kompatybilny z Vite/Astro.
- **Testing Library**: Narzędzia do testowania komponentów React z naciskiem na dostępność.
- **MSW (Mock Service Worker)**: Mockowanie API na poziomie sieci, umożliwia testowanie komunikacji z backendem.

### Testy end-to-end

- **Playwright**: Framework do automatyzacji przeglądarki i testów E2E.
  - Wsparcie dla wielu przeglądarek (Chromium, Firefox, WebKit)
  - Niezawodne i szybkie testy
  - Możliwość debugowania i nagrywania testów

### Cele testowania

- **Pokrycie kodu**: Minimum 80% dla logiki biznesowej
- **Testy jednostkowe**: Walidacja schematów Zod, funkcje pomocnicze, hooki React
- **Testy integracyjne**: API endpoints, middleware, komponenty z API
- **Testy E2E**: Kluczowe scenariusze użytkownika (auth, transakcje, kategorie)
- **Testy bezpieczeństwa**: RLS policies, autoryzacja, podatności (XSS, SQL injection)

## CI/CD i Hosting

- **Github Actions**: Do tworzenia pipeline'ów CI/CD (w tym automatyczne uruchamianie testów).
- **DigitalOcean**: Do hostowania aplikacji za pośrednictwem obrazu docker.
