# Konfiguracja Sekretów GitHub dla CI/CD

Ten dokument opisuje jak skonfigurować sekrety GitHub wymagane do działania workflow CI/CD.

## 📋 Wymagane Sekrety

Workflow `pull-request.yml` wymaga skonfigurowania **GitHub Environment** o nazwie `integration` z następującymi sekretami:

| Nazwa Sekretu | Wymagany | Opis | Gdzie Znaleźć |
|---------------|----------|------|---------------|
| `PUBLIC_SUPABASE_URL` | ✅ Tak | URL projektu Supabase | Supabase Dashboard → Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ Tak | Publiczny klucz API (anon key) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Tak | Service role key (z dostępem admin) | Supabase Dashboard → Settings → API |
| `E2E_TEST_USER_EMAIL` | ✅ Tak | Email użytkownika testowego E2E | Utwórz dedykowanego użytkownika testowego |
| `E2E_TEST_USER_PASSWORD` | ✅ Tak | Hasło użytkownika testowego E2E | Bezpieczne hasło dla użytkownika testowego |

## 🔧 Instrukcja Konfiguracji

### Krok 1: Utwórz lub przygotuj projekt Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Utwórz nowy projekt lub użyj istniejącego **dedykowanego do testów**
   - ⚠️ **WAŻNE**: Nie używaj projektu produkcyjnego do testów E2E!
   - Testy E2E będą tworzyć i usuwać dane testowe
3. Poczekaj aż projekt się zainicjalizuje

### Krok 2: Pobierz klucze API z Supabase

1. W Supabase Dashboard, przejdź do **Settings** → **API**
2. Skopiuj następujące wartości:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key (długi token JWT)
   - **service_role** key (długi token JWT - **zachowaj go w tajemnicy!**)

### Krok 3: Utwórz użytkownika testowego E2E

1. W Supabase Dashboard, przejdź do **Authentication** → **Users**
2. Kliknij **Invite user** lub **Add user**
3. Utwórz użytkownika z:
   - Email: np. `e2etest@gmail.com` (użyj **prawdziwej domeny** jak gmail.com, outlook.com)
   - Password: np. `TestPassword123!` (bezpieczne hasło)
   - ⚠️ **NIE UŻYWAJ** domen takich jak `@example.com`, `@test.com` - Supabase Auth je odrzuca!
4. Zaznacz **Auto Confirm User** jeśli jest dostępne

### Krok 4: Utwórz GitHub Environment

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** (zakładka w górnym menu)
3. W lewym menu kliknij **Environments**
4. Kliknij **New environment**
5. Wpisz nazwę: `integration`
6. Kliknij **Configure environment**

### Krok 5: Dodaj sekrety do Environment

W sekcji **Environment secrets** dodaj każdy sekret osobno:

1. Kliknij **Add secret**
2. **Name**: `PUBLIC_SUPABASE_URL`
   - **Value**: Wklej Project URL z Supabase (np. `https://xxxxx.supabase.co`)
3. Kliknij **Add secret**

4. Kliknij **Add secret**
5. **Name**: `PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Wklej anon public key z Supabase
6. Kliknij **Add secret**

7. Kliknij **Add secret**
8. **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Wklej service_role key z Supabase
9. Kliknij **Add secret**

10. Kliknij **Add secret**
11. **Name**: `E2E_TEST_USER_EMAIL`
    - **Value**: Email użytkownika testowego (np. `e2etest@gmail.com`)
12. Kliknij **Add secret**

13. Kliknij **Add secret**
    - **Value**: Hasło użytkownika testowego
15. Kliknij **Add secret**

### Krok 6: (Opcjonalne) Skonfiguruj Protection Rules

W sekcji **Environment protection rules** możesz dodać dodatkowe zabezpieczenia:

- **Required reviewers**: Wymagaj zatwierdzenia przed uruchomieniem workflow
- **Wait timer**: Dodaj opóźnienie przed uruchomieniem (np. 5 minut)
- **Deployment branches**: Ogranicz do określonych branchy

Dla środowiska `integration` zazwyczaj nie jest to potrzebne.

## ✅ Weryfikacja Konfiguracji

Po skonfigurowaniu sekretów:

1. Utwórz nowy Pull Request do brancha `master`
2. Sprawdź w zakładce **Actions** czy workflow `Pull Request CI` się uruchomił
3. Jeśli workflow kończy się błędem:
   - Sprawdź logi w zakładce Actions
   - Upewnij się, że wszystkie sekrety są poprawnie skonfigurowane
   - Sprawdź czy użytkownik testowy E2E istnieje w Supabase

## 🔒 Bezpieczeństwo

### ⚠️ WAŻNE: Zasady Bezpieczeństwa

- **NIE commituj** sekretów do repozytorium
- **NIE udostępniaj** service_role key publicznie
- **Używaj** dedykowanego projektu Supabase do testów
- **Regularnie rotuj** sekrety (np. co 90 dni)
- **Ogranicz dostęp** do Environment secrets tylko do zaufanych osób

### Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` ma **pełny dostęp** do bazy danych i pomija wszystkie RLS (Row Level Security) policies. 

**Należy go używać tylko**:
- W środowisku CI/CD
- Do operacji administracyjnych (np. czyszczenie danych testowych)
- **NIGDY** w kodzie frontend/client-side

## 🐛 Troubleshooting

### Błąd: "Missing required environment variables"

**Przyczyna**: Brakuje któregoś z wymaganych sekretów

**Rozwiązanie**:
1. Sprawdź czy wszystkie 5 sekretów są dodane do Environment `integration`
2. Sprawdź pisownię nazw sekretów (muszą być **dokładnie** takie jak w tabeli)
3. Sprawdź czy Environment nazywa się dokładnie `integration`

### Błąd: "Authentication failed" w testach E2E

**Przyczyna**: Niepoprawne credentials użytkownika testowego lub użytkownik nie istnieje

**Rozwiązanie**:
1. Sprawdź czy użytkownik z emailem `E2E_TEST_USER_EMAIL` istnieje w Supabase Auth
2. Sprawdź czy hasło jest poprawne
3. Sprawdź czy użytkownik jest **potwierdzony** (Auto Confirm)
4. Użyj prawdziwej domeny email (nie `@example.com`)

### Błąd: "Failed to connect to Supabase"

**Przyczyna**: Niepoprawny URL lub klucze API

**Rozwiązanie**:
1. Sprawdź czy `PUBLIC_SUPABASE_URL` jest poprawny (powinien zaczynać się od `https://`)
2. Sprawdź czy klucze API nie mają dodatkowych spacji na początku/końcu
3. Sprawdź czy projekt Supabase jest aktywny (nie wstrzymany/usunięty)

### Workflow nie ma dostępu do sekretów

**Przyczyna**: Workflow nie ma ustawionego `environment: integration`

**Rozwiązanie**:
1. Sprawdź czy w job `e2e-test` w pliku `.github/workflows/pull-request.yml` jest linia:
   ```yaml
   environment: integration
   ```
2. Jeśli brakuje, dodaj tę linię w definicji joba

## 📚 Dodatkowe Zasoby

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Settings](https://supabase.com/docs/guides/api#api-url-and-keys)

---

**Ostatnia aktualizacja:** 2025-10-18



