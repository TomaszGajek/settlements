# Plan Testów - Settlements

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy dokument określa strategię i plan testów dla aplikacji Settlements - webowego systemu do zarządzania budżetem domowym. Plan uwzględnia specyfikę MVP, wykorzystywane technologie oraz kluczowe funkcjonalności aplikacji.

### 1.2 Cele testowania

- Zapewnienie poprawności działania wszystkich funkcjonalności MVP
- Weryfikacja bezpieczeństwa danych użytkowników (autentykacja, autoryzacja, RLS)
- Walidacja spójności danych między warstwami aplikacji
- Potwierdzenie poprawności działania automatyzacji bazodanowych (triggery)
- Wykrycie i eliminacja błędów krytycznych przed wdrożeniem produkcyjnym
- Weryfikacja wydajności kluczowych operacji (paginacja, agregacje)

### 1.3 Zakres aplikacji

Settlements to aplikacja webowa (desktop-only) umożliwiająca:

- Rejestrację i autentykację użytkowników
- Zarządzanie transakcjami finansowymi (przychody/wydatki)
- Zarządzanie kategoriami transakcji
- Wizualizację danych finansowych (podsumowania, wykresy dzienne)
- Nawigację po okresach (miesiąc/rok)

## 2. Zakres testów

### 2.1 W zakresie testów

- **Moduł autentykacji**: Rejestracja, logowanie, wylogowanie, resetowanie hasła, usuwanie konta
- **Moduł transakcji**: Tworzenie, edycja, usuwanie, paginacja, filtrowanie
- **Moduł kategorii**: Tworzenie, edycja, usuwanie (z automatycznym przepięciem transakcji)
- **Dashboard**: Agregacje danych, wykresy, karty podsumowania, nawigacja po okresach
- **API endpoints**: Wszystkie endpointy z `/api/*`
- **Walidacja danych**: Schematy Zod, walidacja po stronie API
- **Bezpieczeństwo**: RLS policies, middleware, ochrona przed nieautoryzowanym dostępem
- **Triggery bazodanowe**: Automatyczne tworzenie profilu i kategorii, przepięcie transakcji przy usuwaniu kategorii
- **Integracja**: Komunikacja frontend-backend, zarządzanie stanem (React Query)

### 2.2 Poza zakresem testów (MVP)

- Responsywność i widoki mobilne
- Wielowalutowość
- Import/export danych (CSV)
- Zaawansowane raportowanie
- Wyszukiwanie i filtrowanie transakcji
- Operacje masowe
- Tutorial/onboarding
- Testy wydajnościowe pod dużym obciążeniem (>1000 req/s)

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

**Framework**: Vitest

**Zakres**:

- **Funkcje walidacji** (`src/lib/schemas/`):
  - Walidacja schematów transakcji (amount, date, categoryId, type, note)
  - Walidacja schematów kategorii (name, uniqueness)
  - Walidacja danych wejściowych formularzy
- **Funkcje pomocnicze** (`src/lib/utils/`):
  - Formatowanie dat
  - Formatowanie kwot
  - Funkcje mapowania błędów Supabase
- **Hooki React** (`src/lib/hooks/`):
  - useAuth - zarządzanie stanem autentykacji
  - useTransactions, useCategories - hooki React Query
  - useDatePeriod - zarządzanie okresem daty
- **Serwisy** (`src/lib/services/`):
  - Logika biznesowa warstwy klienckiej
  - Transformacje danych

**Kryteria pokrycia**: Minimum 80% pokrycia kodu dla warstwy logiki biznesowej

### 3.2 Testy integracyjne (Integration Tests)

**Framework**: Vitest + Testing Library

**Zakres**:

- **API Endpoints** (`src/pages/api/`):
  - GET/POST/PATCH/DELETE `/api/categories`
  - GET/POST/PATCH/DELETE `/api/transactions`
  - GET `/api/dashboard`
  - Weryfikacja kodów odpowiedzi HTTP
  - Weryfikacja struktury odpowiedzi JSON
  - Weryfikacja obsługi błędów (400, 401, 403, 404, 409, 422, 500)
- **Integracja z bazą danych**:
  - Operacje CRUD przez Supabase client
  - Działanie RLS policies
  - Triggery bazodanowe (handle_new_user, handle_category_delete)
- **Middleware**:
  - Ochrona tras wymagających autentykacji
  - Przekierowania dla zalogowanych/niezalogowanych użytkowników
- **Komponenty React z API**:
  - TransactionForm + mutations
  - CategoryForm + mutations
  - DashboardContent z danymi z API

### 3.3 Testy end-to-end (E2E Tests)

**Framework**: Playwright

**Zakres**:

- **Scenariusze użytkownika**:
  - Rejestracja nowego użytkownika → Dashboard
  - Logowanie → Dashboard → Dodanie transakcji → Edycja → Usunięcie
  - Zarządzanie kategoriami: Dodanie → Edycja → Usunięcie (weryfikacja przepięcia transakcji)
  - Nawigacja między miesiącami/latami
  - Wylogowanie i ponowne logowanie
  - Resetowanie hasła
  - Usunięcie konta
- **Przepływy krytyczne**:
  - Cały flow rejestracji z automatycznym tworzeniem kategorii domyślnych
  - Usunięcie kategorii z weryfikacją zachowania transakcji
  - Infinite scroll na liście transakcji
  - Wizualizacja danych na wykresach

### 3.4 Testy bezpieczeństwa (Security Tests)

**Zakres**:

- **Autentykacja i autoryzacja**:
  - Próba dostępu do chronionej trasy bez tokenu → 401
  - Próba dostępu do danych innego użytkownika → 403
  - Weryfikacja wygasania sesji
  - Weryfikacja poprawności JWT
- **Row-Level Security**:
  - Izolacja danych między użytkownikami
  - Weryfikacja policies dla profiles, categories, transactions
  - Próba odczytu/zapisu danych innego użytkownika przez RLS
- **SQL Injection**:
  - Testy z danymi wejściowymi zawierającymi znaki SQL
- **XSS (Cross-Site Scripting)**:
  - Testy z danymi zawierającymi skrypty JavaScript (pole note w transakcjach)
- **CSRF Protection**:
  - Weryfikacja zabezpieczeń przed atakami CSRF

### 3.5 Testy walidacji danych (Validation Tests)

**Zakres**:

- **Walidacja transakcji**:
  - Kwota: wartość dodatnia, max 2 miejsca po przecinku, zakres 0-999999999.99
  - Data: format YYYY-MM-DD, prawidłowa data
  - CategoryId: prawidłowy UUID, kategoria należy do użytkownika
  - Type: wartość "income" lub "expense"
  - Note: maksymalnie 500 znaków
- **Walidacja kategorii**:
  - Nazwa: 1-100 znaków, unikalna w obrębie użytkownika
  - Nazwa nie może być "Inne" (zarezerwowana)
  - Brak białych znaków na początku/końcu (trim)
- **Walidacja danych wejściowych API**:
  - Próby wysłania nieprawidłowego JSON
  - Próby wysłania niekompletnych danych
  - Próby z wartościami granicznymi (edge cases)

### 3.6 Testy wydajnościowe (Performance Tests)

**Zakres**:

- **Endpointy API**:
  - GET /api/transactions: paginacja, czas odpowiedzi < 200ms dla 20 rekordów
  - GET /api/dashboard: agregacje, czas odpowiedzi < 300ms
  - GET /api/categories: czas odpowiedzi < 50ms
- **Operacje bazodanowe**:
  - Wydajność triggerów (handle_category_delete dla 1000 transakcji)
  - Wydajność zapytań z wykorzystaniem indeksów
- **Infinite scroll**:
  - Płynność ładowania kolejnych stron (pageSize=20)
- **Dashboard**:
  - Czas renderowania wykresów dla 31 dni danych

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Autentykacja

#### TC-AUTH-001: Rejestracja nowego użytkownika

**Priorytet**: Krytyczny
**Warunki wstępne**: Brak konta o podanym emailu
**Kroki**:

1. Otwórz stronę główną (`/`)
2. Przejdź do zakładki "Rejestracja"
3. Wprowadź poprawny email
4. Wprowadź hasło spełniające wymagania (min. 8 znaków)
5. Kliknij "Zarejestruj się"

**Oczekiwany rezultat**:

- Konto zostaje utworzone
- Automatyczne przekierowanie do `/dashboard`
- W bazie danych utworzony profil użytkownika
- Utworzone 5 domyślnych kategorii (Jedzenie, Rachunki, Wynagrodzenie, Rozrywka, Inne)
- Kategoria "Inne" ma `is_deletable: false`

#### TC-AUTH-002: Logowanie z poprawnymi danymi

**Priorytet**: Krytyczny
**Warunki wstępne**: Użytkownik posiada konto
**Kroki**:

1. Otwórz stronę główną (`/`)
2. Wprowadź poprawny email
3. Wprowadź poprawne hasło
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:

- Pomyślne zalogowanie
- Przekierowanie do `/dashboard?month={current}&year={current}`
- Sesja zostaje zapisana w cookies

#### TC-AUTH-003: Logowanie z błędnymi danymi

**Priorytet**: Wysoki
**Kroki**:

1. Wprowadź istniejący email
2. Wprowadź błędne hasło
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:

- Wyświetlenie błędu "Nieprawidłowy email lub hasło"
- Brak przekierowania
- Brak utworzenia sesji

#### TC-AUTH-004: Resetowanie hasła

**Priorytet**: Wysoki
**Kroki**:

1. Kliknij "Zapomniałeś hasła?"
2. Wprowadź email
3. Kliknij "Wyślij link resetujący"
4. Otwórz otrzymany email
5. Kliknij w link resetujący
6. Wprowadź nowe hasło
7. Potwierdź nowe hasło

**Oczekiwany rezultat**:

- Email z linkiem zostaje wysłany
- Po kliknięciu w link otworzona strona `/reset-password`
- Hasło zostaje zmienione
- Możliwość zalogowania się nowym hasłem

#### TC-AUTH-005: Wylogowanie

**Priorytet**: Krytyczny
**Warunki wstępne**: Użytkownik jest zalogowany
**Kroki**:

1. Będąc na stronie `/dashboard` lub `/settings`
2. Kliknij przycisk wylogowania

**Oczekiwany rezultat**:

- Sesja zostaje usunięta
- Przekierowanie do `/`
- Próba dostępu do `/dashboard` przekierowuje do `/`

#### TC-AUTH-006: Próba dostępu do chronionej trasy bez logowania

**Priorytet**: Krytyczny
**Warunki wstępne**: Użytkownik niezalogowany
**Kroki**:

1. W przeglądarce przejdź bezpośrednio do `/dashboard`

**Oczekiwany rezultat**:

- Automatyczne przekierowanie do `/?reason=session_expired`
- Wyświetlenie komunikatu o wygaśnięciu sesji

### 4.2 Zarządzanie transakcjami

#### TC-TRANS-001: Dodanie nowej transakcji (wydatek)

**Priorytet**: Krytyczny
**Warunki wstępne**: Użytkownik zalogowany
**Kroki**:

1. Na stronie `/dashboard` kliknij FAB (Floating Action Button)
2. Wybierz typ "Wydatek"
3. Wprowadź kwotę: 150.50
4. Wybierz datę: 2025-10-15
5. Wybierz kategorię: Jedzenie
6. Wprowadź notatkę: "Zakupy spożywcze"
7. Kliknij "Dodaj"

**Oczekiwany rezultat**:

- Transakcja zostaje zapisana w bazie
- Modal się zamyka
- Toast z potwierdzeniem
- Transakcja pojawia się na liście
- Karty podsumowania zostają zaktualizowane
- Wykres dzienny zostaje zaktualizowany

#### TC-TRANS-002: Dodanie transakcji z walidacją (błędne dane)

**Priorytet**: Wysoki
**Kroki**:

1. Kliknij FAB
2. Wprowadź kwotę: -100 (wartość ujemna)
3. Spróbuj dodać transakcję

**Oczekiwany rezultat**:

- Wyświetlenie błędu "Kwota musi być większa od 0"
- Transakcja nie zostaje zapisana
- Modal pozostaje otwarty

#### TC-TRANS-003: Edycja istniejącej transakcji

**Priorytet**: Krytyczny
**Warunki wstępne**: Istnieje transakcja do edycji
**Kroki**:

1. Na liście transakcji kliknij przycisk edycji
2. Zmień kwotę na 200.00
3. Zmień notatkę na "Zaktualizowane zakupy"
4. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Transakcja zostaje zaktualizowana
- Modal się zamyka
- Toast z potwierdzeniem
- Zmiany widoczne na liście
- Karty podsumowania zaktualizowane

#### TC-TRANS-004: Usunięcie transakcji

**Priorytet**: Krytyczny
**Warunki wstępne**: Istnieje transakcja do usunięcia
**Kroki**:

1. Kliknij przycisk usunięcia przy transakcji
2. Potwierdź usunięcie w dialogu

**Oczekiwany rezultat**:

- Transakcja zostaje usunięta z bazy
- Dialog się zamyka
- Toast z potwierdzeniem
- Transakcja znika z listy
- Karty podsumowania zaktualizowane

#### TC-TRANS-005: Paginacja transakcji (infinite scroll)

**Priorytet**: Wysoki
**Warunki wstępne**: >20 transakcji w danym miesiącu
**Kroki**:

1. Przejdź do dashboardu
2. Przewiń listę transakcji do końca

**Oczekiwany rezultat**:

- Automatyczne ładowanie kolejnej strony (20 transakcji)
- Wyświetlenie spinnera podczas ładowania
- Płynne dołączenie nowych transakcji do listy
- Brak duplikatów

#### TC-TRANS-006: Filtrowanie transakcji po miesiącu/roku

**Priorytet**: Wysoki
**Kroki**:

1. Na dashboardzie wybierz "Październik 2025"
2. Użyj nawigacji do przełączenia na "Wrzesień 2025"

**Oczekiwany rezultat**:

- URL aktualizowany do `?month=9&year=2025`
- Lista transakcji pokazuje tylko transakcje z września 2025
- Karty podsumowania pokazują dane dla września 2025
- Wykres dzienny pokazuje dane dla września 2025

### 4.3 Zarządzanie kategoriami

#### TC-CAT-001: Dodanie nowej kategorii

**Priorytet**: Krytyczny
**Warunki wstępne**: Użytkownik zalogowany
**Kroki**:

1. Przejdź do `/settings`
2. W sekcji kategorii kliknij "Dodaj kategorię"
3. Wprowadź nazwę: "Transport"
4. Kliknij "Dodaj"

**Oczekiwany rezultat**:

- Kategoria zostaje zapisana w bazie
- Modal się zamyka
- Toast z potwierdzeniem
- Kategoria pojawia się na liście
- Kategoria dostępna w formularzu transakcji

#### TC-CAT-002: Próba dodania kategorii o istniejącej nazwie

**Priorytet**: Wysoki
**Warunki wstępne**: Kategoria "Transport" już istnieje
**Kroki**:

1. Kliknij "Dodaj kategorię"
2. Wprowadź nazwę: "Transport"
3. Kliknij "Dodaj"

**Oczekiwany rezultat**:

- API zwraca błąd 409 Conflict
- Wyświetlenie błędu "Kategoria o tej nazwie już istnieje"
- Kategoria nie zostaje dodana
- Modal pozostaje otwarty

#### TC-CAT-003: Próba dodania kategorii o nazwie "Inne"

**Priorytet**: Wysoki
**Kroki**:

1. Kliknij "Dodaj kategorię"
2. Wprowadź nazwę: "Inne"
3. Kliknij "Dodaj"

**Oczekiwany rezultat**:

- Walidacja Zod blokuje formularz
- Wyświetlenie błędu "Nie można użyć nazwy 'Inne' (jest zarezerwowana)"
- Kategoria nie zostaje dodana

#### TC-CAT-004: Edycja kategorii

**Priorytet**: Wysoki
**Warunki wstępne**: Kategoria "Transport" istnieje
**Kroki**:

1. Na liście kategorii kliknij edycję przy "Transport"
2. Zmień nazwę na "Transport publiczny"
3. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Kategoria zostaje zaktualizowana
- Modal się zamyka
- Toast z potwierdzeniem
- Nowa nazwa widoczna na liście i w formularzu transakcji

#### TC-CAT-005: Usunięcie kategorii z przepięciem transakcji

**Priorytet**: Krytyczny
**Warunki wstępne**:

- Kategoria "Transport" istnieje
- 3 transakcje przypisane do kategorii "Transport"

**Kroki**:

1. Kliknij przycisk usunięcia przy kategorii "Transport"
2. Potwierdź usunięcie w dialogu

**Oczekiwany rezultat**:

- Kategoria zostaje usunięta z bazy
- Trigger `handle_category_delete` automatycznie przepina 3 transakcje do kategorii "Inne"
- Dialog się zamyka
- Toast z potwierdzeniem
- Kategoria znika z listy
- Wszystkie 3 transakcje zachowane, przypisane do "Inne"

#### TC-CAT-006: Próba usunięcia kategorii systemowej "Inne"

**Priorytet**: Krytyczny
**Kroki**:

1. Znajdź kategorię "Inne" na liście

**Oczekiwany rezultat**:

- Przycisk usunięcia jest nieaktywny lub niewidoczny
- Próba wysłania DELETE na API zwraca 403 Forbidden
- Kategoria "Inne" pozostaje w bazie

### 4.4 Dashboard

#### TC-DASH-001: Wyświetlenie kart podsumowania

**Priorytet**: Krytyczny
**Warunki wstępne**:

- Użytkownik ma transakcje w październiku 2025
- 2 przychody: 5000, 500 (suma: 5500)
- 3 wydatki: 1000, 500, 200 (suma: 1700)

**Kroki**:

1. Przejdź do `/dashboard?month=10&year=2025`

**Oczekiwany rezultat**:

- Karta "Przychody" pokazuje: 5 500,00 zł
- Karta "Wydatki" pokazuje: 1 700,00 zł
- Karta "Bilans" pokazuje: 3 800,00 zł (kolor zielony)

#### TC-DASH-002: Wyświetlenie wykresu dziennego

**Priorytet**: Wysoki
**Warunki wstępne**: Transakcje z różnych dni października
**Kroki**:

1. Przejdź do dashboardu października 2025

**Oczekiwany rezultat**:

- Wykres słupkowy zawiera 31 słupków (dni miesiąca)
- Każdy dzień pokazuje sumę przychodów (kolor zielony) i wydatków (kolor czerwony)
- Dni bez transakcji mają wartość 0
- Tooltip pokazuje szczegóły po najechaniu na słupek

#### TC-DASH-003: Nawigacja między miesiącami

**Priorytet**: Wysoki
**Kroki**:

1. Na dashboardzie października kliknij strzałkę "wstecz"
2. Kliknij strzałkę "naprzód"

**Oczekiwany rezultat**:

- Po kliknięciu "wstecz": URL zmienia się na `?month=9&year=2025`, dane dla września
- Po kliknięciu "naprzód": powrót do `?month=10&year=2025`, dane dla października
- Karty, wykres i lista transakcji są aktualizowane

#### TC-DASH-004: Dashboard bez transakcji

**Priorytet**: Średni
**Warunki wstępne**: Brak transakcji w wybranym miesiącu
**Kroki**:

1. Przejdź do miesiąca bez transakcji

**Oczekiwany rezultat**:

- Karty podsumowania pokazują: 0,00 zł
- Wykres dzienny wyświetla 0 dla wszystkich dni
- Lista transakcji jest pusta z komunikatem "Brak transakcji"

## 5. Środowisko testowe

### 5.1 Środowiska

- **Lokalne (Development)**:
  - Node.js 22.14.0
  - Supabase Local Development
  - `http://localhost:4321`
- **Staging**:
  - Supabase Cloud (projekt testowy)
  - Środowisko zbliżone do produkcji
- **Produkcja**:
  - DigitalOcean + Docker
  - Supabase Cloud (projekt produkcyjny)

### 5.2 Dane testowe

- **Użytkownicy testowi**: 3 konta z różnymi zestawami danych
  - user1@test.com: 50 transakcji, 10 kategorii
  - user2@test.com: 200 transakcji, 5 kategorii (testy wydajności)
  - user3@test.com: 0 transakcji (nowe konto)
- **Kategorie**: Zestaw standardowy + custom
- **Transakcje**: Różne kwoty, typy, daty (ostatnie 12 miesięcy)

### 5.3 Narzędzia

- **Przeglądarka**: Chrome (wersja najnowsza), Edge
- **Rozdzielczość**: 1920x1080 (desktop)
- **System operacyjny**: Windows 10/11, macOS
- **Narzędzia deweloperskie**: Chrome DevTools dla analiz sieciowych

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe i integracyjne

- **Vitest**: Runner testów dla TypeScript
- **Testing Library**: Testy komponentów React
- **MSW (Mock Service Worker)**: Mockowanie API w testach

### 6.2 Testy E2E

- **Playwright**: Automatyzacja przeglądarki
- **Playwright Test**: Framework testowy

### 6.3 Testy API

- **Postman/Insomnia**: Manualne testowanie API
- **Vitest + Supertest**: Automatyczne testy API

### 6.4 Testy bezpieczeństwa

- **OWASP ZAP**: Skanowanie bezpieczeństwa
- **Supabase RLS Test Suite**: Dedykowane testy RLS policies

### 6.5 Testy wydajnościowe

- **Lighthouse**: Analiza wydajności frontendu
- **k6**: Testy obciążeniowe API

### 6.6 Zarządzanie testami

- **GitHub Actions**: CI/CD pipeline
- **Jest/Vitest Coverage**: Raportowanie pokrycia kodu

## 7. Harmonogram testów

### Faza 1: Przygotowanie (Tydzień 1)

- Konfiguracja środowisk testowych
- Instalacja i konfiguracja narzędzi
- Przygotowanie danych testowych
- Utworzenie repozytorium testów

### Faza 2: Testy jednostkowe (Tydzień 2)

- Testy schematów walidacji Zod
- Testy funkcji pomocniczych
- Testy hooków React
- Cel: 80% pokrycia kodu

### Faza 3: Testy integracyjne (Tydzień 3)

- Testy API endpoints
- Testy triggerów bazodanowych
- Testy middleware
- Testy RLS policies

### Faza 4: Testy E2E (Tydzień 4)

- Scenariusze użytkownika (autentykacja)
- Scenariusze transakcji i kategorii
- Scenariusze dashboardu
- Przepływy krytyczne

### Faza 5: Testy bezpieczeństwa (Tydzień 5)

- Testy autoryzacji i autentykacji
- Testy RLS
- Testy podatności (SQL injection, XSS)
- Penetration testing

### Faza 6: Testy wydajnościowe (Tydzień 6)

- Testy obciążeniowe API
- Testy wydajności frontendu
- Optymalizacja na podstawie wyników

### Faza 7: Testy regresyjne i finalizacja (Tydzień 7)

- Ponowne testy po poprawkach
- Testy smoke na staging
- Dokumentacja wyników
- Przekazanie do wdrożenia

## 8. Kryteria akceptacji testów

### 8.1 Kryteria go/no-go dla produkcji

**MUST HAVE (Blokujące wdrożenie)**:

- 0 błędów krytycznych (severity: critical)
- 100% scenariuszy testowych dla funkcjonalności krytycznych (auth, CRUD transakcji/kategorii) zakończonych sukcesem
- Wszystkie testy bezpieczeństwa RLS przeszły pomyślnie
- Brak podatności wysokiego ryzyka (High/Critical z OWASP ZAP)
- Testy E2E dla kluczowych przepływów: 100% pass rate

**SHOULD HAVE (Do naprawy w następnej iteracji)**:

- Maksymalnie 5 błędów wysokiego priorytetu (severity: high)
- Pokrycie kodu testami jednostkowymi: min. 70%
- Wszystkie testy API zwracają poprawne kody statusu
- Czas odpowiedzi API < 500ms dla 95% requestów

**NICE TO HAVE**:

- 0 błędów średniego i niskiego priorytetu
- Pokrycie kodu: 80%+
- Wszystkie testy wydajnościowe spełniają założenia

### 8.2 Metryki sukcesu

- **Test Pass Rate**: > 95% dla wszystkich typów testów
- **Code Coverage**: > 80% dla logiki biznesowej
- **API Response Time**: < 200ms (p95)
- **Zero Security Vulnerabilities**: Brak High/Critical
- **E2E Stability**: < 2% flaky tests

### 8.3 Definicje priorytetów błędów

- **Critical**: Aplikacja nie działa, brak możliwości logowania, utrata danych, naruszenie bezpieczeństwa
- **High**: Funkcjonalność nie działa zgodnie z założeniami, wpływ na UX
- **Medium**: Drobne odchylenia od specyfikacji, błędy wizualne
- **Low**: Kosmetyczne problemy, sugestie ulepszeń

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 Zespół testowy

- **QA Lead**:
  - Nadzór nad całym procesem testowania
  - Zarządzanie harmonogramem
  - Raportowanie do kierownictwa
- **QA Engineers (2 osoby)**:
  - Wykonywanie testów manualnych
  - Tworzenie i utrzymywanie testów automatycznych
  - Raportowanie błędów
- **QA Automation Engineer**:
  - Konfiguracja CI/CD dla testów
  - Rozwój frameworka testowego
  - Testy wydajnościowe

### 9.2 Zespół deweloperski

- **Backend Developer**:
  - Poprawianie błędów API i bazy danych
  - Wsparcie w testach integracyjnych
  - Testy jednostkowe dla logiki serwerowej
- **Frontend Developer**:
  - Poprawianie błędów UI/UX
  - Testy komponentów React
  - Wsparcie w testach E2E
- **DevOps Engineer**:
  - Konfiguracja środowisk testowych
  - Wdrażanie poprawek na staging
  - Monitoring infrastruktury

### 9.3 Product Owner

- Priorytetyzacja błędów
- Akceptacja funkcjonalności
- Decyzje go/no-go

## 10. Procedury raportowania błędów

### 10.1 Szablon zgłoszenia błędu

**ID**: [AUTO] BUG-YYYY-MM-DD-XXX  
**Tytuł**: [Krótki opis problemu]  
**Priorytet**: Critical / High / Medium / Low  
**Środowisko**: Local / Staging / Production  
**Przeglądarka**: Chrome 120 / Edge 120

**Kroki do reprodukcji**:

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

**Oczekiwany rezultat**: [Co powinno się stać]  
**Aktualny rezultat**: [Co się dzieje]

**Załączniki**:

- Screenshot/video
- Logi konsoli
- Network trace (jeśli dotyczy API)

**Dodatkowe informacje**:

- Czy błąd jest powtarzalny: Tak / Nie
- Dotyczy użytkownika: [email testowy]
- Związane z: [link do funkcjonalności/ticket]

### 10.2 Kanały raportowania

- **GitHub Issues**: Główne repozytorium błędów
- **Slack #qa-bugs**: Natychmiastowe powiadomienia o critical bugs
- **Weekly QA Report**: Podsumowanie tygodniowe (e-mail)

### 10.3 Workflow obsługi błędów

1. **New**: Nowo zgłoszony błąd
2. **In Review**: QA Lead weryfikuje i priorytetyzuje
3. **Confirmed**: Błąd potwierdzony, przypisany do developera
4. **In Progress**: Developer pracuje nad poprawką
5. **Ready for Testing**: Poprawka na staging, oczekuje na weryfikację
6. **Verified**: QA potwierdza poprawę
7. **Closed**: Błąd naprawiony i zweryfikowany

### 10.4 SLA dla błędów

- **Critical**: Reakcja w ciągu 2h, naprawa w ciągu 24h
- **High**: Reakcja w ciągu 8h, naprawa w ciągu 3 dni
- **Medium**: Reakcja w ciągu 24h, naprawa w ciągu tygodnia
- **Low**: Reakcja w ciągu 3 dni, naprawa w następnej iteracji

---

**Dokument zatwierdzony przez**:  
QA Lead: ********\_********  
Product Owner: ********\_********  
Data: ********\_********
