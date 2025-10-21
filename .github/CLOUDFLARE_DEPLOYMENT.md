# Konfiguracja Deployment na Cloudflare Pages

Ten dokument opisuje jak skonfigurować automatyczne wdrożenie aplikacji na Cloudflare Pages za pomocą GitHub Actions.

## 📋 Wymagania

Przed rozpoczęciem upewnij się, że masz:

1. ✅ Konto Cloudflare (bezpłatne lub płatne)
2. ✅ Projekt Cloudflare Pages utworzony lub gotowy do utworzenia
3. ✅ Dostęp do GitHub repository z uprawnieniami administratora
4. ✅ Projekt Supabase (URL i klucze API)

## 🚀 Kroki Konfiguracji

### Krok 1: Przygotowanie Projektu Cloudflare Pages

#### Opcja A: Utwórz nowy projekt przez Dashboard

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Pages** w menu bocznym
3. Kliknij **Create a project**
4. Wybierz **Direct Upload** (będziemy wdrażać przez GitHub Actions, nie przez Git integration)
5. Podaj nazwę projektu (np. `settlements-app`)
6. Zapamiętaj nazwę projektu - będzie potrzebna w sekretach

#### Opcja B: Projekt zostanie utworzony automatycznie przy pierwszym wdrożeniu

Jeśli wolisz, możesz pominąć tworzenie projektu ręcznie - zostanie utworzony automatycznie podczas pierwszego wdrożenia przez Wrangler.

### Krok 2: Uzyskaj Cloudflare API Token

1. W Cloudflare Dashboard, kliknij na swój profil (prawy górny róg)
2. Wybierz **My Profile**
3. Przejdź do zakładki **API Tokens**
4. Kliknij **Create Token**
5. Wybierz szablon **Edit Cloudflare Workers** lub utwórz custom token z następującymi uprawnieniami:
   - **Account** → **Cloudflare Pages** → **Edit**
6. W sekcji **Account Resources**:
   - Wybierz swoje konto Cloudflare
7. Kliknij **Continue to summary**
8. Sprawdź uprawnienia i kliknij **Create Token**
9. **WAŻNE**: Skopiuj token i zapisz go w bezpiecznym miejscu - **nie będziesz mógł go zobaczyć ponownie!**

### Krok 3: Znajdź Cloudflare Account ID

1. W Cloudflare Dashboard, przejdź do głównej strony (Overview)
2. Na prawej stronie znajdziesz **Account ID**
3. Kliknij aby skopiować (lub zanotuj go)

### Krok 4: Utwórz GitHub Environment "production"

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** (zakładka w górnym menu)
3. W lewym menu kliknij **Environments**
4. Kliknij **New environment**
5. Wpisz nazwę: `production`
6. Kliknij **Configure environment**

### Krok 5: Dodaj sekrety do Environment "production"

W sekcji **Environment secrets** dodaj każdy sekret osobno:

#### Sekret 1: CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: Wklej API Token z Kroku 2
- Kliknij **Add secret**

#### Sekret 2: CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: Wklej Account ID z Kroku 3
- Kliknij **Add secret**

#### Sekret 3: CLOUDFLARE_PROJECT_NAME
- **Name**: `CLOUDFLARE_PROJECT_NAME`
- **Value**: Nazwa twojego projektu Cloudflare Pages (np. `settlements-app`)
- Kliknij **Add secret**

#### Sekret 4: PUBLIC_SUPABASE_URL
- **Name**: `PUBLIC_SUPABASE_URL`
- **Value**: URL projektu Supabase (np. `https://xxxxx.supabase.co`)
- Kliknij **Add secret**

#### Sekret 5: PUBLIC_SUPABASE_ANON_KEY
- **Name**: `PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Anon key z projektu Supabase
- Kliknij **Add secret**

### Krok 6: (Opcjonalne) Skonfiguruj Protection Rules

W sekcji **Environment protection rules** możesz dodać dodatkowe zabezpieczenia:

- **Required reviewers**: Wymagaj zatwierdzenia przed wdrożeniem
- **Wait timer**: Dodaj opóźnienie przed wdrożeniem
- **Deployment branches**: Ogranicz do brancha `master`

Dla środowiska `production` **zalecamy** włączenie przynajmniej jednej z tych opcji.

## 📊 Struktura Workflow

Workflow `master.yml` wykonuje następujące kroki:

1. **Linting** - Sprawdzenie kodu za pomocą ESLint
2. **Unit & Integration Tests** - Uruchomienie testów jednostkowych i integracyjnych
3. **Build** - Zbudowanie aplikacji dla produkcji
4. **Deploy** - Wdrożenie na Cloudflare Pages
5. **Status** - Podsumowanie wyniku wdrożenia

### Diagram przepływu

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
    ┌────────┐
    │ Deploy │
    └────┬───┘
         ↓
    ┌────────┐
    │ Status │
    └────────┘
```

## 🔍 Zmienne Środowiskowe

### Podczas budowania (Build)

Aplikacja Astro wymaga następujących zmiennych podczas procesu budowania:

- `PUBLIC_SUPABASE_URL` - URL projektu Supabase
- `PUBLIC_SUPABASE_ANON_KEY` - Publiczny klucz API Supabase

### W Cloudflare Pages

Po wdrożeniu, możesz również skonfigurować zmienne środowiskowe bezpośrednio w Cloudflare Pages:

1. Przejdź do swojego projektu w Cloudflare Dashboard
2. Kliknij **Settings** → **Environment variables**
3. Dodaj te same zmienne (opcjonalnie):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

**WAŻNE**: Zmienne zaczynające się od `PUBLIC_` są dostępne w kodzie client-side.

## ✅ Weryfikacja Wdrożenia

Po skonfigurowaniu sekretów:

1. Stwórz commit i wypchnij zmiany do brancha `master`:
   ```bash
   git add .
   git commit -m "Configure Cloudflare deployment"
   git push origin master
   ```

2. Przejdź do zakładki **Actions** w GitHub
3. Sprawdź czy workflow `Master Branch CI/CD` się uruchomił
4. Poczekaj aż wszystkie kroki zakończą się sukcesem (zielony znacznik ✅)
5. Po zakończeniu, przejdź do Cloudflare Dashboard → Pages
6. Znajdź swój projekt i kliknij na niego
7. Skopiuj URL wdrożonej aplikacji (np. `https://settlements-app.pages.dev`)

## 🔒 Bezpieczeństwo

### ⚠️ WAŻNE: Zasady Bezpieczeństwa

- **NIE commituj** sekretów do repozytorium
- **NIE udostępniaj** API Token publicznie
- **Używaj** GitHub Environments do izolacji sekretów
- **Regularnie rotuj** API Token (np. co 90 dni)
- **Ogranicz dostęp** do Environment secrets tylko do zaufanych osób
- **Włącz 2FA** na koncie Cloudflare

### Cloudflare API Token

Token ma dostęp do zarządzania Cloudflare Pages w twoim koncie.

**Należy go używać tylko**:
- W środowisku CI/CD (GitHub Actions)
- **NIGDY** w kodzie aplikacji
- **NIGDY** w publicznych repozytoriach bez szyfrowania

## 🐛 Troubleshooting

### Błąd: "Missing required environment variables"

**Przyczyna**: Brakuje któregoś z wymaganych sekretów

**Rozwiązanie**:
1. Sprawdź czy wszystkie 5 sekretów są dodane do Environment `production`
2. Sprawdź pisownię nazw sekretów (muszą być **dokładnie** takie jak w dokumentacji)
3. Sprawdź czy Environment nazywa się dokładnie `production`

### Błąd: "Authentication failed" podczas wdrożenia

**Przyczyna**: Niepoprawny API Token lub Account ID

**Rozwiązanie**:
1. Sprawdź czy `CLOUDFLARE_API_TOKEN` jest poprawny i nie wygasł
2. Sprawdź czy `CLOUDFLARE_ACCOUNT_ID` jest poprawny
3. Sprawdź uprawnienia API Token - musi mieć dostęp do Cloudflare Pages
4. Wygeneruj nowy token jeśli poprzedni wygasł

### Błąd: "Project not found"

**Przyczyna**: Niepoprawna nazwa projektu lub projekt nie istnieje

**Rozwiązanie**:
1. Sprawdź czy `CLOUDFLARE_PROJECT_NAME` jest poprawny
2. Sprawdź czy projekt istnieje w Cloudflare Dashboard → Pages
3. Jeśli projekt nie istnieje, utwórz go ręcznie lub pozwól Wrangler utworzyć go automatycznie

### Błąd: "Failed to connect to Supabase" w deployed app

**Przyczyna**: Niepoprawne zmienne Supabase lub brak zmiennych

**Rozwiązanie**:
1. Sprawdź czy `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` są poprawne
2. Sprawdź czy zmienne są ustawione w GitHub Secrets dla environment `production`
3. Upewnij się, że projekt Supabase jest aktywny

### Workflow nie uruchamia się automatycznie

**Przyczyna**: Workflow nie jest włączony lub jest problem z konfiguracją

**Rozwiązanie**:
1. Sprawdź czy plik `.github/workflows/master.yml` istnieje w branchu master
2. Przejdź do Actions → Wybierz workflow → Kliknij "Enable workflow" jeśli jest wyłączony
3. Sprawdź czy masz uprawnienia do uruchamiania Actions w repo

## 📚 Dodatkowe Zasoby

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

## 🔄 Rollback i Wersjonowanie

### Wersje wdrożeń w Cloudflare Pages

Cloudflare Pages automatycznie przechowuje historię wszystkich wdrożeń:

1. Przejdź do Cloudflare Dashboard → Pages → Twój projekt
2. Kliknij zakładkę **Deployments**
3. Zobaczysz listę wszystkich wdrożeń
4. Możesz:
   - **Preview** - Podejrzeć konkretną wersję
   - **Rollback** - Przywrócić poprzednią wersję
   - **View details** - Zobaczyć szczegóły wdrożenia

### Manualne rollback

Jeśli potrzebujesz szybko wrócić do poprzedniej wersji:

1. Znajdź ostatnią działającą wersję w historii deployments
2. Kliknij na nią
3. Kliknij **Promote to production** lub **Rollback to this deployment**
4. Potwierdź akcję

---

**Ostatnia aktualizacja:** 2025-10-21

