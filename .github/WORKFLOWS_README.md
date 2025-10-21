# GitHub Actions Workflows - Przegląd

Ten dokument opisuje strukturę i działanie wszystkich workflow CI/CD w projekcie.

## 📋 Dostępne Workflows

### 1. Pull Request CI (`pull-request.yml`)

**Trigger**: Otwarcie lub aktualizacja Pull Request do brancha `master`

**Cel**: Automatyczna walidacja kodu przed merge

**Kroki**:
1. **Linting** - Sprawdzenie kodu ESLint
2. **Unit & Integration Tests** - Testy jednostkowe i integracyjne z pokryciem kodu
3. **E2E Tests** - Testy end-to-end z Playwright (wymaga environment `integration`)
4. **Status Comment** - Automatyczny komentarz w PR z wynikami testów

**Environment**: `integration` (tylko dla E2E tests)

**Wymagane sekrety**:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`

**Artefakty**:
- `unit-coverage-report` - Raport pokrycia kodu testami
- `playwright-report` - HTML raport z Playwright
- `playwright-results` - Wyniki testów Playwright

---

### 2. Master Branch CI/CD (`master.yml`)

**Trigger**: Push do brancha `master`

**Cel**: Automatyczne wdrożenie na produkcję po walidacji

**Kroki**:
1. **Linting** - Sprawdzenie kodu ESLint
2. **Unit & Integration Tests** - Testy jednostkowe i integracyjne z pokryciem kodu
3. **Build** - Budowanie aplikacji dla produkcji
4. **Deploy** - Wdrożenie na Cloudflare Pages
5. **Status** - Podsumowanie wyniku wdrożenia

**Environment**: `production` (tylko dla Deploy)

**Wymagane sekrety**:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`

**Artefakty**:
- `unit-coverage-report` - Raport pokrycia kodu testami
- `dist` - Zbudowana aplikacja (tymczasowo, 1 dzień)

---

## 🔧 Użyte GitHub Actions

Wszystkie akcje są aktualne i używają najnowszych stabilnych wersji:

| Action | Wersja | Opis | Status |
|--------|--------|------|--------|
| `actions/checkout` | v5 | Klonowanie repozytorium | ✅ Aktualna |
| `actions/setup-node` | v6 | Konfiguracja Node.js | ✅ Aktualna |
| `actions/upload-artifact` | v4 | Upload artefaktów | ✅ Aktualna |
| `actions/download-artifact` | v5 | Download artefaktów | ✅ Aktualna |
| `cloudflare/wrangler-action` | v3 | Deploy na Cloudflare | ✅ Aktualna |
| `marocchino/sticky-pull-request-comment` | v2 | Komentarze w PR | ✅ Aktualna |

**Ostatnia weryfikacja**: 2025-10-21

---

## 📊 Diagram przepływu

### Pull Request Workflow

```
PR do master
    ↓
┌─────────┐
│ Linting │
└────┬────┘
     ↓
┌─────────────────────────┐
│ Unit & Integration Tests│────────┐
└─────────────────────────┘        │
                                   │ (parallel)
┌──────────┐                       │
│ E2E Tests│←──────────────────────┘
└────┬─────┘
     ↓
┌────────────────┐
│ Status Comment │
└────────────────┘
```

### Master Branch Workflow

```
Push do master
    ↓
┌─────────┐
│ Linting │
└────┬────┘
     ↓
┌──────────────────────────┐
│ Unit & Integration Tests │
└────────┬─────────────────┘
         ↓
    ┌────────┐
    │ Build  │
    └────┬───┘
         ↓
  ┌─────────────┐
  │   Deploy    │
  │ (Cloudflare)│
  └────┬────────┘
       ↓
  ┌────────┐
  │ Status │
  └────────┘
```

---

## 🔐 Konfiguracja Sekretów

### Environment: `integration` (dla PR workflow)

Służy do testowania E2E z użyciem dedykowanej instancji Supabase.

Wymagane sekrety:
- `PUBLIC_SUPABASE_URL` - URL projektu Supabase testowego
- `PUBLIC_SUPABASE_ANON_KEY` - Anon key projektu testowego
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (do czyszczenia danych testowych)
- `E2E_TEST_USER_EMAIL` - Email użytkownika testowego
- `E2E_TEST_USER_PASSWORD` - Hasło użytkownika testowego

**Dokumentacja**: Zobacz [SECRETS_SETUP.md](./SECRETS_SETUP.md)

### Environment: `production` (dla Master workflow)

Służy do wdrożenia aplikacji na Cloudflare Pages z produkcyjną instancją Supabase.

Wymagane sekrety:
- `PUBLIC_SUPABASE_URL` - URL projektu Supabase produkcyjnego
- `PUBLIC_SUPABASE_ANON_KEY` - Anon key projektu produkcyjnego
- `CLOUDFLARE_API_TOKEN` - Token API Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare
- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu Cloudflare Pages

**Dokumentacja**: Zobacz [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

---

## 🚦 Status Checks

### Pull Request

Aby PR mógł zostać zmergowany, wszystkie następujące checks muszą przejść pomyślnie:

- ✅ Code Linting
- ✅ Unit & Integration Tests
- ✅ E2E Tests

### Master Branch

Deployment na produkcję odbywa się tylko gdy:

- ✅ Code Linting
- ✅ Unit & Integration Tests
- ✅ Build

Jeśli którykolwiek z powyższych kroków się nie powiedzie, deployment **nie zostanie uruchomiony**.

---

## 📈 Monitorowanie i Debugging

### Sprawdzenie statusu workflow

1. Przejdź do zakładki **Actions** w GitHub
2. Wybierz odpowiedni workflow:
   - `Pull Request CI` - dla PR
   - `Master Branch CI/CD` - dla master
3. Kliknij na konkretne uruchomienie aby zobaczyć szczegóły

### Dostęp do artefaktów

Artefakty są dostępne przez 7 dni (coverage reports, Playwright reports) lub 1 dzień (build artifacts):

1. Wejdź w szczegóły uruchomienia workflow
2. Przewiń na dół do sekcji **Artifacts**
3. Kliknij na artefakt aby go pobrać

### Debugging nieudanych testów E2E

1. Pobierz `playwright-report` artifact
2. Rozpakuj archiwum
3. Otwórz `index.html` w przeglądarce
4. Przejrzyj screenshoty i video (jeśli dostępne)

### Debugging nieudanego deploymentu

1. Sprawdź logi w GitHub Actions → Job **Deploy to Cloudflare Pages**
2. Sprawdź w Cloudflare Dashboard → Pages → Twój projekt → Deployments
3. Sprawdź czy wszystkie environment variables są ustawione poprawnie
4. Sprawdź czy build artifacts zostały poprawnie wygenerowane

---

## 🔄 Utrzymanie i Aktualizacje

### Aktualizacja wersji GitHub Actions

Zgodnie z praktykami opisanymi w [github-action cursor rules](./.cursor/github-action.mdc):

1. Sprawdź najnowszą wersję akcji:
   ```powershell
   curl -s https://api.github.com/repos/{owner}/{repo}/releases/latest | ConvertFrom-Json | Select-Object -ExpandProperty tag_name
   ```

2. Sprawdź czy akcja nie jest archived:
   ```powershell
   curl -s https://api.github.com/repos/{owner}/{repo} | ConvertFrom-Json | Select-Object -ExpandProperty archived
   ```

3. Sprawdź dokumentację akcji na GitHub przed aktualizacją

### Harmonogram przeglądów

- **Co miesiąc**: Sprawdź czy są dostępne nowe wersje używanych akcji
- **Co 3 miesiące**: Przejrzyj i zaktualizuj sekrety (rotacja tokenów)
- **Co 6 miesięcy**: Przejrzyj i zoptymalizuj workflow (czasy wykonania, koszty)

---

## 📚 Dodatkowe Zasoby

### Dokumentacja

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages CI/CD](https://developers.cloudflare.com/pages/platform/direct-upload/)
- [Playwright CI Configuration](https://playwright.dev/docs/ci)

### Linki do konfiguracji

- [Konfiguracja Sekretów dla PR Workflow](./SECRETS_SETUP.md)
- [Konfiguracja Cloudflare Deployment](./CLOUDFLARE_DEPLOYMENT.md)

### Wsparcie

W przypadku problemów:
1. Sprawdź sekcję Troubleshooting w odpowiedniej dokumentacji
2. Przejrzyj logi w GitHub Actions
3. Sprawdź status services: [GitHub Status](https://www.githubstatus.com/), [Cloudflare Status](https://www.cloudflarestatus.com/)

---

**Ostatnia aktualizacja**: 2025-10-21
**Node.js Version**: 22 (z `.nvmrc`)
**Projekt**: 10x-settlements

