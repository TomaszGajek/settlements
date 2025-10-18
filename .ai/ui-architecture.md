# UI Architecture - Settlements MVP

## 1. Przegląd Architektury

### 1.1. Założenia Projektowe

- **Framework**: Astro 5 z React 19 dla interaktywnych komponentów
- **Styling**: Tailwind CSS 4 z Shadcn/ui
- **State Management**: React Query (TanStack Query) + React Context API
- **Routing**: File-based routing Astro
- **Target Platform**: Desktop only (min-width: 1024px)
- **Theme**: Dark mode only
- **Locale**: Polski (pl-PL)

### 1.2. Kluczowe Decyzje Architektoniczne

1. **Hybrid Rendering**: Astro dla statycznego contentu, React dla interaktywności
2. **API-First**: Wszystkie dane przez Astro API endpoints → Supabase
3. **Client-Side State**: URL params jako source of truth dla month/year
4. **Authentication**: JWT tokens przez Supabase Auth z middleware validation
5. **Data Fetching**: React Query z optimistic updates i cache management

---

## 2. Struktura Projektu

### 2.1. Organizacja Katalogów

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Formularz logowania
│   │   ├── RegisterForm.tsx        # Formularz rejestracji
│   │   ├── ResetPasswordForm.tsx   # Reset hasła
│   │   └── AuthProvider.tsx        # Context provider dla auth state
│   ├── dashboard/
│   │   ├── SummaryCards.tsx        # Karty: Przychody, Wydatki, Bilans
│   │   ├── DailyChart.tsx          # Wykres słupkowy (Recharts)
│   │   ├── TransactionsList.tsx    # Lista transakcji z infinite scroll
│   │   ├── TransactionItem.tsx     # Pojedynczy element listy
│   │   ├── TransactionModal.tsx    # Modal dodawania/edycji
│   │   ├── DeleteDialog.tsx        # Confirmation dialog usuwania
│   │   └── DatePeriodNav.tsx       # Nawigacja month/year
│   ├── settings/
│   │   ├── CategoriesList.tsx      # Lista kategorii
│   │   ├── CategoryItem.tsx        # Pojedyncza kategoria
│   │   ├── CategoryModal.tsx       # Modal dodawania/edycji kategorii
│   │   ├── DeleteAccountSection.tsx # Sekcja usuwania konta
│   │   └── DeleteCategoryDialog.tsx # Confirmation usunięcia kategorii
│   ├── shared/
│   │   ├── Header.tsx              # Główny header z nawigacją
│   │   ├── LoadingSpinner.tsx      # Spinner component
│   │   ├── LoadingSkeleton.tsx     # Skeleton screens
│   │   ├── ErrorBoundary.tsx       # Error boundary wrapper
│   │   ├── EmptyState.tsx          # Empty state component
│   │   ├── OfflineIndicator.tsx    # Offline banner
│   │   └── Logo.tsx                # Logo SVG component
│   ├── ui/                         # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   └── toast.tsx
│   └── Welcome.astro              # Existing welcome component
├── layouts/
│   ├── Layout.astro               # Base layout (auth wrapper)
│   ├── AuthLayout.astro           # Layout dla stron publicznych
│   └── AppLayout.astro            # Layout dla protected pages
├── pages/
│   ├── index.astro                # Login/Register page (public)
│   ├── dashboard.astro            # Main dashboard (protected)
│   ├── settings.astro             # Settings page (protected)
│   ├── reset-password.astro       # Password reset (public)
│   └── api/
│       ├── dashboard.ts           # GET dashboard summary
│       ├── transactions.ts        # GET/POST transactions
│       ├── transactions/[id].ts   # PATCH/DELETE transaction
│       ├── categories.ts          # GET/POST categories
│       └── categories/[id].ts     # PATCH/DELETE category
├── lib/
│   ├── hooks/
│   │   ├── useAuth.ts             # Auth state management
│   │   ├── useDashboard.ts        # Dashboard data fetching
│   │   ├── useTransactions.ts     # Transactions infinite query
│   │   ├── useCategories.ts       # Categories query
│   │   ├── useTransactionMutations.ts # Create/update/delete
│   │   ├── useCategoryMutations.ts    # Category mutations
│   │   ├── useCurrencyInput.ts    # Currency formatting hook
│   │   ├── useDatePeriod.ts       # URL params sync for month/year
│   │   └── useHotkeys.ts          # Keyboard shortcuts
│   ├── services/
│   │   ├── dashboard.service.ts   # Dashboard business logic
│   │   ├── transactions.service.ts # Transactions service
│   │   └── categories.service.ts  # Categories service
│   ├── schemas/
│   │   ├── transaction.schema.ts  # Zod schema dla transakcji
│   │   ├── category.schema.ts     # Zod schema dla kategorii
│   │   ├── auth.schema.ts         # Zod schema dla auth forms
│   │   └── index.ts               # Export all schemas
│   ├── api-client.ts              # Centralized API client z error handling
│   ├── utils.ts                   # Utility functions
│   ├── constants.ts               # App-wide constants
│   ├── config.ts                  # Runtime configuration
│   ├── logger.ts                  # Logging wrapper
│   └── errorMessages.ts           # User-friendly error messages dictionary
├── db/
│   ├── supabase.client.ts         # Supabase client singleton
│   └── database.types.ts          # Generated Supabase types
├── middleware/
│   └── index.ts                   # Auth middleware
├── styles/
│   └── global.css                 # Global styles, CSS variables, theme
├── types.ts                       # Shared types (entities, DTOs)
└── env.d.ts                       # Environment variables types
```

---

## 3. Struktura Nawigacji

### 3.1. Routing Map

```
/ (index.astro)
├─ Login/Register (public, default)
└─ [Auth required routes - middleware protected]

/dashboard (dashboard.astro)
├─ Main app view
├─ Query params: ?month={1-12}&year={YYYY}
└─ Components:
   ├─ SummaryCards
   ├─ DatePeriodNav
   ├─ DailyChart
   └─ TransactionsList

/settings (settings.astro)
├─ Categories management
└─ Account settings

/reset-password (reset-password.astro)
└─ Password reset flow (public)
```

### 3.2. Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Initial Load                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ├─── Authenticated? ──┐
                        │                     │
                    ┌───NO──┐            ┌───YES──┐
                    │       │            │        │
                    ▼       │            ▼        │
            ┌──────────────┐│    ┌──────────────┐│
            │   /          ││    │  /dashboard  ││
            │ Login/Signup ││    │  (current    ││
            │              ││    │   month)     ││
            └──────────────┘│    └──────────────┘│
                    │       │            │        │
                    │       │            │        │
            Successful Login│            │        │
                    └───────┴────────────┘        │
                            │                     │
                            ▼                     │
                    ┌──────────────┐              │
                    │  /dashboard  │◄─────────────┘
                    │              │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Navigate    │   │    Add/Edit  │   │   Settings   │
│  Month/Year  │   │  Transaction │   │     Link     │
└──────────────┘   └──────────────┘   └──────┬───────┘
        │                  │                  │
        │                  │                  ▼
        │                  │          ┌──────────────┐
        │                  │          │  /settings   │
        │                  │          │              │
        │                  │          └──────┬───────┘
        │                  │                 │
        │                  │          ┌──────┴───────┐
        │                  │          │              │
        │                  │          ▼              ▼
        │                  │   ┌─────────────┐ ┌─────────────┐
        │                  │   │  Manage     │ │   Delete    │
        │                  │   │ Categories  │ │   Account   │
        │                  │   └─────────────┘ └─────────────┘
        │                  │
        └──────────────────┴────► Refresh Dashboard Data
```

---

## 4. Mapy Podróży Użytkownika (User Flows)

### 4.1. Flow: Rejestracja i Pierwsze Logowanie

```
START: Użytkownik wchodzi na aplikację (/)
    │
    ├─ Widzi stronę z zakładkami: [Login] [Register]
    │
    ├─ Klika [Register]
    │
    ├─ Wypełnia formularz:
    │   • Email (validation: email format)
    │   • Password (min 6 chars)
    │   • Confirm Password (must match)
    │
    ├─ Submit → API Call (Supabase Auth)
    │   │
    │   ├─ ERROR → Toast "Email już używany" / "Błąd rejestracji"
    │   │           Stay on form, show field errors
    │   │
    │   └─ SUCCESS → Auto-login
    │       │
    │       ├─ DB Trigger creates:
    │       │   • User profile
    │       │   • Default categories (jedzenie, opłaty, etc.)
    │       │
    │       ├─ Redirect to /dashboard?month={current}&year={current}
    │       │
    │       └─ Show:
    │           • Toast: "Konto utworzone pomyślnie!"
    │           • Welcome message: "Witaj w Settlements! 👋"
    │           • Empty state: "Dodaj pierwszą transakcję"
    │           • CTA button: highlighted [+ Dodaj transakcję]
    │
END: Użytkownik na dashboardzie, gotowy do dodania pierwszej transakcji
```

### 4.2. Flow: Logowanie

```
START: Użytkownik na / (już ma konto)
    │
    ├─ Widzi zakładkę [Login] (default active)
    │
    ├─ Wypełnia:
    │   • Email
    │   • Password
    │
    ├─ Optional: Klika "Zapomniałem hasła" → /reset-password
    │
    ├─ Submit → API Call (Supabase Auth)
    │   │
    │   ├─ ERROR → Toast "Nieprawidłowy email lub hasło"
    │   │
    │   └─ SUCCESS → Redirect to /dashboard?month={current}&year={current}
    │       │
    │       └─ Load dashboard data
    │
END: Użytkownik zalogowany na dashboardzie
```

### 4.3. Flow: Dodawanie Transakcji

```
START: Użytkownik na /dashboard
    │
    ├─ Klika [+] FAB (floating action button)
    │   OR: Keyboard shortcut Ctrl+K
    │   OR: Empty state CTA "Dodaj pierwszą transakcję"
    │
    ├─ TransactionModal opens (mode: 'create')
    │   │
    │   ├─ Focus na pierwszym polu (Amount)
    │   │
    │   ├─ Formularz:
    │   │   • Type: [Przychód] [Wydatek] (toggle, default: Wydatek)
    │   │   • Amount: ___,__ zł (auto-format, min 0.01)
    │   │   • Date: DD.MM.RRRR (calendar picker, default: today)
    │   │   • Category: [Select dropdown] (alphabetical, "Inne" last)
    │   │   • Note: (optional, max 500 chars, counter shown)
    │   │
    │   ├─ Validation (real-time):
    │   │   • Amount > 0 ✓
    │   │   • Category selected ✓
    │   │   • Date valid ✓
    │   │
    │   ├─ User fills form
    │   │
    │   ├─ Clicks [Zapisz] OR Ctrl+Enter
    │   │   │
    │   │   ├─ Button shows loading spinner
    │   │   │
    │   │   ├─ API Call: POST /api/transactions
    │   │   │   │
    │   │   │   ├─ Optimistic Update:
    │   │   │   │   • Add transaction to cache
    │   │   │   │   • Update summary cards
    │   │   │   │   • Close modal immediately
    │   │   │   │   • Toast: "Zapisywanie..."
    │   │   │   │
    │   │   │   ├─ ERROR → Rollback cache
    │   │   │   │           Toast: "Nie udało się zapisać" + Retry option
    │   │   │   │           Reopen modal with data preserved
    │   │   │   │
    │   │   │   └─ SUCCESS → Toast: "Transakcja dodana"
    │   │   │                 Invalidate dashboard & transactions queries
    │   │   │                 Transaction appears in list
    │   │   │                 Summary cards updated
    │   │   │                 Chart updated
    │   │   │
    │   │   └─ If transaction date ≠ current month:
    │   │       Toast: "Transakcja dodana do [Miesiąc Rok]"
    │   │              + Link: "Przejdź do tego miesiąca"
    │   │
    │   └─ User clicks [Anuluj] OR Escape OR backdrop
    │       │
    │       ├─ If form dirty (has changes):
    │       │   Alert: "Masz niezapisane zmiany. Zamknąć?"
    │       │   [Anuluj] [Odrzuć zmiany]
    │       │
    │       └─ If pristine: Close immediately
    │
END: Transakcja dodana i widoczna na liście
```

### 4.4. Flow: Edycja Transakcji

```
START: Użytkownik widzi transakcję na liście
    │
    ├─ Hover na transaction item
    │   → Action buttons visible: [Edit] [Delete]
    │
    ├─ Klika [Edit icon]
    │   OR: Focus transaction + Enter key
    │
    ├─ TransactionModal opens (mode: 'edit')
    │   │
    │   ├─ Form pre-filled z existing data
    │   │
    │   ├─ User modifies fields
    │   │
    │   ├─ Validation (same as create)
    │   │
    │   ├─ Clicks [Zapisz]
    │   │   │
    │   │   ├─ API Call: PATCH /api/transactions/{id}
    │   │   │   │
    │   │   │   ├─ Optimistic Update:
    │   │   │   │   • Update transaction in cache
    │   │   │   │   • Update summary if amount/type changed
    │   │   │   │   • Close modal
    │   │   │   │   • Toast: "Zapisywanie..."
    │   │   │   │
    │   │   │   ├─ ERROR → Rollback + Toast "Nie udało się zapisać"
    │   │   │   │
    │   │   │   └─ SUCCESS → Toast: "Transakcja zaktualizowana"
    │   │   │                 Refresh queries
    │   │   │
    │   │   └─ Special case: Transaction deleted by another tab
    │   │       API returns 404 → Toast: "Ta transakcja została usunięta"
    │   │                         Close modal
    │   │
    │   └─ [Anuluj] → Same unsaved changes handling as create
    │
END: Transakcja zaktualizowana
```

### 4.5. Flow: Usuwanie Transakcji

```
START: Użytkownik na transaction item
    │
    ├─ Klika [Delete icon]
    │   OR: Focus transaction + Delete key
    │
    ├─ AlertDialog opens:
    │   │
    │   ├─ Title: "Usuń transakcję?"
    │   │
    │   ├─ Content: Podsumowanie transakcji
    │   │   "150,75 zł - Jedzenie - 12.10.2024"
    │   │
    │   ├─ Actions: [Anuluj] [Usuń]
    │   │
    │   ├─ User clicks [Usuń]
    │   │   │
    │   │   ├─ API Call: DELETE /api/transactions/{id}
    │   │   │   │
    │   │   │   ├─ Optimistic Update:
    │   │   │   │   • Remove from cache
    │   │   │   │   • Update summary
    │   │   │   │   • Toast: "Usuwanie..."
    │   │   │   │
    │   │   │   ├─ ERROR → Rollback + Toast "Nie udało się usunąć" + Retry
    │   │   │   │
    │   │   │   └─ SUCCESS → Toast: "Transakcja usunięta"
    │   │   │                 Transaction fades out from list
    │   │   │                 Summary updated
    │   │   │                 Chart updated
    │   │   │
    │   │   └─ Close dialog
    │   │
    │   └─ User clicks [Anuluj] OR Escape
    │       → Close dialog, no action
    │
END: Transakcja usunięta
```

### 4.6. Flow: Nawigacja między Miesiącami

```
START: Użytkownik na /dashboard?month=10&year=2025
    │
    ├─ Widzi DatePeriodNav:
    │   [←] [Październik 2025] [→] [Year: 2025 ▼]
    │
    ├─ Option A: Klika [←] (poprzedni miesiąc)
    │   │
    │   ├─ URL updates: ?month=9&year=2025
    │   │
    │   ├─ React Query detects key change
    │   │   │
    │   │   ├─ Cancels in-flight requests for month=10
    │   │   │
    │   │   ├─ Checks cache for month=9 data
    │   │   │   │
    │   │   │   ├─ HIT: Shows cached data immediately
    │   │   │   │       Background refetch if stale
    │   │   │   │
    │   │   │   └─ MISS: Shows loading skeleton
    │   │   │           Fetch new data
    │   │   │
    │   │   └─ Updates:
    │   │       • Summary cards (fade transition)
    │   │       • Chart (smooth data change)
    │   │       • Transactions list (reset to page 1)
    │   │
    │   └─ Keyboard: Arrow Left (←) same effect
    │
    ├─ Option B: Klika [→] (następny miesiąc)
    │   │
    │   ├─ If current month → Button disabled
    │   │
    │   ├─ Else: URL updates to next month
    │   │        Same data loading flow
    │   │
    │   └─ Keyboard: Arrow Right (→)
    │
    ├─ Option C: Klika [Year dropdown]
    │   │
    │   ├─ Opens Select z available years:
    │   │   [2025] [2024] [2023] ...
    │   │
    │   ├─ User selects year (e.g., 2024)
    │   │
    │   ├─ URL updates: ?month=1&year=2024 (January of selected year)
    │   │
    │   └─ Data loads for January 2024
    │
    └─ Prefetching optimization:
        • On hover [→]: Prefetch next month data (100ms delay)
        • Improves perceived performance
│
END: Użytkownik przegląda dane z wybranego okresu
```

### 4.7. Flow: Infinite Scroll Transakcji

```
START: Użytkownik na dashboard z >20 transakcjami w miesiącu
    │
    ├─ Initial load: Shows first 20 transactions (page=1)
    │
    ├─ User scrolls down
    │   │
    │   ├─ Intersection Observer detects:
    │   │   Element 3 from bottom is visible
    │   │
    │   ├─ Trigger: Fetch next page
    │   │   │
    │   │   ├─ API Call: GET /api/transactions?month=10&year=2025&page=2
    │   │   │
    │   │   ├─ Shows inline spinner at bottom of list
    │   │   │
    │   │   ├─ SUCCESS:
    │   │   │   • Append 20 more items to list
    │   │   │   • Hide spinner
    │   │   │   • Continue observing for page 3
    │   │   │
    │   │   └─ ERROR:
    │   │       • Toast: "Nie udało się załadować więcej transakcji"
    │   │       • Show [Spróbuj ponownie] button
    │   │
    │   ├─ User continues scrolling
    │   │   → Pages 3, 4, ... load automatically
    │   │
    │   └─ Reached last page (page >= totalPages):
    │       • Show: "To wszystkie transakcje z tego miesiąca"
    │       • Total count: "Wyświetlono 87 transakcji"
    │
    ├─ User navigates to different month:
    │   • Infinite query resets
    │   • Back to page 1 of new month
    │
    └─ User scrolls back up:
        • All loaded pages remain in cache
        • No re-fetch needed
│
END: Użytkownik może przeglądać wszystkie transakcje z płynnym scrollingiem
```

### 4.8. Flow: Zarządzanie Kategoriami

```
START: Użytkownik klika [Ustawienia] w header
    │
    ├─ Navigate to /settings
    │
    ├─ Page renders z dwiema sekcjami:
    │   ┌─────────────────────────────────────────┐
    │   │ Zarządzanie kategoriami                 │
    │   ├─────────────────────────────────────────┤
    │   │ • Jedzenie (24) [Edit] [Delete]         │
    │   │ • Opłaty (12) [Edit] [Delete]           │
    │   │ • Wynagrodzenie (3) [Edit] [Delete]     │
    │   │ • Przyjemności (8) [Edit] [Delete]      │
    │   │ • Inne (2) [Systemowa - nie można usunąć]│
    │   │                                         │
    │   │ [+ Dodaj kategorię]                     │
    │   ├─────────────────────────────────────────┤
    │   │ Ustawienia konta                        │
    │   ├─────────────────────────────────────────┤
    │   │ [Usuń konto] (destructive button)       │
    │   └─────────────────────────────────────────┘
    │
    ├─ Flow A: Dodawanie kategorii
    │   │
    │   ├─ Klika [+ Dodaj kategorię]
    │   │
    │   ├─ CategoryModal opens (mode: 'create')
    │   │   │
    │   │   ├─ Input: Nazwa kategorii
    │   │   │   • Max 100 chars
    │   │   │   • Debounced async validation (unique check)
    │   │   │   • Error: "Kategoria o tej nazwie już istnieje"
    │   │   │
    │   │   ├─ Clicks [Zapisz]
    │   │   │   │
    │   │   │   ├─ API: POST /api/categories
    │   │   │   │   │
    │   │   │   │   ├─ 409 Conflict → Show error on field
    │   │   │   │   │
    │   │   │   │   └─ 201 Created → Toast: "Kategoria dodana"
    │   │   │   │                     Close modal
    │   │   │   │                     New category in list
    │   │   │   │                     Available in transaction forms
    │   │   │   │
    │   │   │   └─ Invalidate: categories query
    │   │   │
    │   │   └─ [Anuluj] → Close modal
    │   │
    │   └─ END: Nowa kategoria dostępna
    │
    ├─ Flow B: Edycja kategorii
    │   │
    │   ├─ Klika [Edit] przy kategorii (NIE "Inne")
    │   │
    │   ├─ CategoryModal opens (mode: 'edit')
    │   │   • Pre-filled: current name
    │   │
    │   ├─ User zmienia nazwę
    │   │
    │   ├─ Clicks [Zapisz]
    │   │   │
    │   │   ├─ API: PATCH /api/categories/{id}
    │   │   │   │
    │   │   │   ├─ 409 Conflict → "Ta nazwa jest już używana"
    │   │   │   │
    │   │   │   ├─ 403 Forbidden → "Nie można edytować tej kategorii"
    │   │   │   │
    │   │   │   └─ 200 OK → Toast: "Kategoria zaktualizowana"
    │   │   │                Nazwa updated everywhere
    │   │   │                (lista, transactions, dropdowns)
    │   │   │
    │   │   └─ Invalidate: categories + transactions queries
    │   │
    │   └─ END: Kategoria przemianowana
    │
    ├─ Flow C: Usuwanie kategorii
    │   │
    │   ├─ Klika [Delete] przy kategorii
    │   │   • "Inne" NIE ma przycisku Delete
    │   │
    │   ├─ DeleteCategoryDialog opens:
    │   │   │
    │   │   ├─ Title: "Usuń kategorię 'Jedzenie'?"
    │   │   │
    │   │   ├─ Content:
    │   │   │   "Ta kategoria zawiera 24 transakcje.
    │   │   │    Wszystkie zostaną przeniesione do kategorii 'Inne'."
    │   │   │
    │   │   ├─ Actions: [Anuluj] [Usuń]
    │   │   │
    │   │   ├─ User clicks [Usuń]
    │   │   │   │
    │   │   │   ├─ API: DELETE /api/categories/{id}
    │   │   │   │   │
    │   │   │   │   ├─ Backend (trigger):
    │   │   │   │   │   • Reassigns all transactions to "Inne"
    │   │   │   │   │   • Deletes category
    │   │   │   │   │
    │   │   │   │   ├─ 403 → "Nie można usunąć tej kategorii"
    │   │   │   │   │
    │   │   │   │   └─ 204 No Content → Toast: "Kategoria usunięta"
    │   │   │   │                        Category removed from list
    │   │   │   │                        Removed from dropdowns
    │   │   │   │                        Transactions show "Inne"
    │   │   │   │
    │   │   │   └─ Invalidate: categories + transactions + dashboard
    │   │   │
    │   │   └─ [Anuluj] → Close dialog
    │   │
    │   └─ END: Kategoria usunięta, transakcje bezpieczne w "Inne"
    │
    └─ Flow D: Usuwanie konta
        │
        ├─ Klika [Usuń konto] (w sekcji Ustawienia konta)
        │
        ├─ AlertDialog opens:
        │   │
        │   ├─ Warning:
        │   │   "Ta operacja jest nieodwracalna.
        │   │    Wszystkie Twoje dane (transakcje, kategorie)
        │   │    zostaną trwale usunięte."
        │   │
        │   ├─ Input: Aktualne hasło (type=password)
        │   │   • Required for confirmation
        │   │
        │   ├─ Checkbox: "Rozumiem, że ta operacja jest nieodwracalna"
        │   │   • Must be checked to enable [Usuń] button
        │   │
        │   ├─ User fills password + checks box
        │   │
        │   ├─ Clicks [Usuń konto]
        │   │   │
        │   │   ├─ API: DELETE /api/auth/user (or Supabase method)
        │   │   │   │
        │   │   │   ├─ Validates password
        │   │   │   │   │
        │   │   │   │   ├─ INVALID → "Nieprawidłowe hasło"
        │   │   │   │   │
        │   │   │   │   └─ VALID → Proceeds with deletion
        │   │   │   │
        │   │   │   ├─ Database CASCADE:
        │   │   │   │   • Deletes user profile
        │   │   │   │   • Deletes all categories
        │   │   │   │   • Deletes all transactions
        │   │   │   │   • Deletes auth.users record
        │   │   │   │
        │   │   │   └─ SUCCESS:
        │   │   │       • Clear React Query cache
        │   │   │       • Clear localStorage
        │   │   │       • Logout
        │   │   │       • Redirect to /
        │   │   │       • Toast: "Konto zostało usunięte"
        │   │   │
        │   │   └─ ERROR → Toast + keep user logged in
        │   │
        │   └─ [Anuluj] → Close dialog safely
        │
        └─ END: Konto całkowicie usunięte
```

### 4.9. Flow: Wylogowanie

```
START: Użytkownik zalogowany na dowolnej stronie
    │
    ├─ Klika [Wyloguj] w header (top-right)
    │
    ├─ No confirmation dialog (standard UX)
    │
    ├─ Logout process:
    │   │
    │   ├─ API: supabase.auth.signOut()
    │   │   │
    │   │   ├─ Button shows loading (disabled)
    │   │   │
    │   │   ├─ Broadcast logout event:
    │   │   │   • Other tabs receive event
    │   │   │   • All tabs logout simultaneously
    │   │   │
    │   │   ├─ Clear state:
    │   │   │   • React Query cache (queryClient.clear())
    │   │   │   • Auth context state
    │   │   │   • Session cookies
    │   │   │
    │   │   ├─ Redirect to /
    │   │   │
    │   │   ├─ Toast: "Wylogowano pomyślnie"
    │   │   │
    │   │   └─ ERROR (network failure):
    │   │       • Still clear local state
    │   │       • Still redirect to /
    │   │       • Toast: "Nie udało się wylogować, ale sesja wyczyszczona"
    │   │
    │   └─ User lands on login page
    │
END: Użytkownik wylogowany, może się zalogować ponownie
```

---

## 5. Architektura Komponentów

### 5.1. Component Hierarchy - Dashboard Page

```
dashboard.astro
└─ AppLayout.astro
   ├─ Header.tsx (client:load)
   │  ├─ Logo
   │  ├─ Navigation Links: [Dashboard*] [Ustawienia]
   │  └─ User Section: [email] [Wyloguj]
   │
   └─ Main Content
      ├─ OfflineIndicator.tsx (client:idle)
      │  └─ Conditional banner jeśli offline
      │
      ├─ DatePeriodNav.tsx (client:load)
      │  ├─ [← Button]
      │  ├─ Display: "Październik 2025"
      │  ├─ [→ Button] (disabled jeśli current month)
      │  └─ Year Select Dropdown
      │
      ├─ ErrorBoundary.tsx (client:load)
      │  └─ Wraps dashboard content
      │     │
      │     ├─ DashboardContent.tsx
      │     │  │
      │     │  ├─ SummaryCards.tsx (client:load)
      │     │  │  ├─ Card: Przychody (green accent)
      │     │  │  ├─ Card: Wydatki (red accent)
      │     │  │  └─ Card: Bilans (dynamic color)
      │     │  │     └─ Optional: Trend badge vs previous month
      │     │  │
      │     │  ├─ Suspense (fallback: Skeleton)
      │     │  │  └─ DailyChart.tsx (client:visible, lazy)
      │     │  │     └─ Recharts BarChart
      │     │  │        ├─ XAxis: dates
      │     │  │        ├─ YAxis: amounts
      │     │  │        ├─ Bar: income (green)
      │     │  │        ├─ Bar: expenses (red)
      │     │  │        └─ Tooltip: custom dark themed
      │     │  │
      │     │  └─ TransactionsList.tsx (client:visible)
      │     │     ├─ Infinite scroll container
      │     │     ├─ EmptyState (jeśli no transactions)
      │     │     │  └─ Illustration + Message + CTA
      │     │     │
      │     │     ├─ TransactionItem.tsx × N
      │     │     │  ├─ Date (DD.MM format)
      │     │     │  ├─ Category badge + icon
      │     │     │  ├─ Amount (formatted, colored)
      │     │     │  ├─ Note icon (jeśli exists) → Tooltip
      │     │     │  └─ Actions (on hover):
      │     │     │     ├─ Edit button → TransactionModal
      │     │     │     └─ Delete button → DeleteDialog
      │     │     │
      │     │     ├─ IntersectionObserver trigger element
      │     │     ├─ Inline Spinner (loading next page)
      │     │     └─ End message: "To wszystkie transakcje"
      │     │
      │     └─ FAB (Floating Action Button)
      │        └─ [+] → Opens TransactionModal
      │
      ├─ Suspense (fallback: null)
      │  └─ TransactionModal.tsx (client:idle, lazy)
      │     ├─ Dialog component (Shadcn)
      │     ├─ Mode: 'create' | 'edit'
      │     └─ Form (React Hook Form + Zod):
      │        ├─ Type Toggle: [Przychód] [Wydatek]
      │        ├─ Amount Input (currency formatted)
      │        ├─ Date Picker (Popover + Calendar)
      │        ├─ Category Select (searchable dropdown)
      │        ├─ Note Textarea (optional, 500 chars counter)
      │        └─ Actions:
      │           ├─ [Anuluj]
      │           └─ [Zapisz] (disabled while invalid/submitting)
      │
      ├─ Suspense (fallback: null)
      │  └─ DeleteDialog.tsx (client:idle, lazy)
      │     ├─ AlertDialog component
      │     ├─ Transaction summary display
      │     └─ Actions: [Anuluj] [Usuń]
      │
      └─ Toaster (client:load)
         └─ Toast notifications container (Sonner)
```

### 5.2. Component Hierarchy - Settings Page

```
settings.astro
└─ AppLayout.astro
   ├─ Header.tsx (same as dashboard)
   │
   └─ Main Content
      ├─ ErrorBoundary.tsx
      │  └─ Settings Content
      │     │
      │     ├─ Section 1: Zarządzanie kategoriami
      │     │  │
      │     │  ├─ Section Header + [+ Dodaj kategorię] button
      │     │  │
      │     │  └─ CategoriesList.tsx (client:load)
      │     │     ├─ LoadingSkeleton (podczas fetch)
      │     │     │
      │     │     ├─ CategoryItem.tsx × N
      │     │     │  ├─ Name + Transaction count badge
      │     │     │  ├─ System badge (jeśli "Inne")
      │     │     │  └─ Actions (jeśli NOT "Inne"):
      │     │     │     ├─ [Edit] → CategoryModal
      │     │     │     └─ [Delete] → DeleteCategoryDialog
      │     │     │
      │     │     └─ Special: "Inne" category
      │     │        └─ No edit/delete, marked as [Systemowa]
      │     │
      │     ├─ Divider
      │     │
      │     └─ Section 2: Ustawienia konta
      │        └─ DeleteAccountSection.tsx (client:load)
      │           ├─ Warning text
      │           └─ [Usuń konto] button (destructive)
      │              └─ Opens DeleteAccountDialog
      │
      ├─ Suspense (fallback: null)
      │  └─ CategoryModal.tsx (client:idle, lazy)
      │     ├─ Dialog component
      │     ├─ Mode: 'create' | 'edit'
      │     └─ Form:
      │        ├─ Name Input (max 100, unique validation)
      │        └─ Actions: [Anuluj] [Zapisz]
      │
      ├─ Suspense (fallback: null)
      │  └─ DeleteCategoryDialog.tsx (client:idle, lazy)
      │     ├─ AlertDialog
      │     ├─ Category name display
      │     ├─ Transaction count warning
      │     └─ Actions: [Anuluj] [Usuń]
      │
      ├─ Suspense (fallback: null)
      │  └─ DeleteAccountDialog.tsx (client:idle, lazy)
      │     ├─ AlertDialog
      │     ├─ Warning message
      │     ├─ Password input (confirmation)
      │     ├─ Checkbox: "Rozumiem..."
      │     └─ Actions: [Anuluj] [Usuń konto]
      │
      └─ Toaster (same as dashboard)
```

### 5.3. Component Hierarchy - Auth Page

```
index.astro
└─ AuthLayout.astro
   ├─ Logo / App Name (centered)
   │
   └─ Main Content (centered card)
      ├─ Tabs.tsx (client:load)
      │  ├─ TabsList: [Logowanie] [Rejestracja]
      │  │
      │  ├─ TabsContent: Login
      │  │  └─ LoginForm.tsx
      │  │     ├─ Email Input
      │  │     ├─ Password Input (with show/hide toggle)
      │  │     ├─ Link: "Zapomniałem hasła" → /reset-password
      │  │     ├─ [Zaloguj] button
      │  │     └─ Error display area
      │  │
      │  └─ TabsContent: Register
      │     └─ RegisterForm.tsx
      │        ├─ Email Input
      │        ├─ Password Input (with requirements indicator)
      │        ├─ Confirm Password Input
      │        ├─ [Zarejestruj] button
      │        └─ Error display area
      │
      └─ Toaster
```

### 5.4. Shared Components Specifications

#### Header.tsx

```typescript
interface HeaderProps {
  // No props - gets auth state from context
}

Features:
- Sticky positioning (top: 0)
- Backdrop blur effect
- Dark theme background
- Border bottom
- Height: 64px
- Navigation active state indicator
- Responsive padding

Layout:
[Logo] [Dashboard] [Ustawienia] ... [user@email.com] [Wyloguj]
```

#### LoadingSkeleton.tsx

```typescript
interface LoadingSkeletonProps {
  variant: 'cards' | 'chart' | 'list' | 'table';
  count?: number; // dla list/table
}

Purpose:
- Show during initial data fetch
- Match layout of actual content
- Pulse animation
- Dark theme compatible
```

#### EmptyState.tsx

```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: string; // SVG path or component
  action?: {
    label: string;
    onClick: () => void;
  };
}

Purpose:
- Contextual empty states
- Clear call-to-action
- Encouraging tone
- SVG illustration support
```

---

## 6. State Management Strategy

### 6.1. Authentication State

**Provider**: `AuthProvider.tsx` (React Context)

```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Implemented with:
- Supabase auth.onAuthStateChange listener
- Auto-refresh token handling
- Broadcast Channel for multi-tab sync
- Persistence through Supabase SDK
```

**Usage**:

```typescript
const { user, signOut } = useAuth();
```

### 6.2. Server State (API Data)

**Library**: React Query (TanStack Query)

**Configuration**:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s default
      cacheTime: 300_000, // 5min default
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Query Keys Structure**:

```typescript
// Dashboard
["dashboard", { month, year }][
  // Transactions
  ("transactions", { month, year, page })
][
  // Categories
  "categories"
][
  // User profile
  ("profile", userId)
];
```

**Custom Hooks**:

```typescript
// useDashboard.ts
function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: ["dashboard", { month, year }],
    queryFn: () => fetchDashboard(month, year),
    staleTime: 30_000,
  });
}

// useTransactions.ts
function useTransactions(month: number, year: number) {
  return useInfiniteQuery({
    queryKey: ["transactions", { month, year }],
    queryFn: ({ pageParam = 1 }) => fetchTransactions(month, year, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    staleTime: 30_000,
  });
}

// useCategories.ts
function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 300_000, // 5min - categories change rarely
  });
}

// useTransactionMutations.ts
function useTransactionMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onMutate: async (newTransaction) => {
      // Optimistic update
      await queryClient.cancelQueries(["transactions"]);
      const previous = queryClient.getQueryData(["transactions"]);

      queryClient.setQueryData(["transactions"], (old) => ({
        ...old,
        pages: [[newTransaction, ...old.pages[0]], ...old.pages.slice(1)],
      }));

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(["transactions"], context.previous);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries(["dashboard"]);
    },
  });

  // Similar for update and delete...

  return { createMutation, updateMutation, deleteMutation };
}
```

### 6.3. URL State (Navigation)

**Hook**: `useDatePeriod.ts`

```typescript
interface DatePeriod {
  month: number; // 1-12
  year: number;
}

function useDatePeriod(): {
  period: DatePeriod;
  setPeriod: (period: DatePeriod) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  setYear: (year: number) => void;
} {
  // Read from URL search params
  const [searchParams, setSearchParams] = useSearchParams();

  const period = useMemo(
    () => ({
      month: parseInt(searchParams.get("month") || getCurrentMonth()),
      year: parseInt(searchParams.get("year") || getCurrentYear()),
    }),
    [searchParams]
  );

  const setPeriod = useCallback(
    (newPeriod: DatePeriod) => {
      setSearchParams({
        month: newPeriod.month.toString(),
        year: newPeriod.year.toString(),
      });
    },
    [setSearchParams]
  );

  // Helper methods...

  return { period, setPeriod, nextMonth, prevMonth, setYear };
}
```

**Benefits**:

- Deep linking support
- Browser back/forward works
- State persists on refresh
- Shareable URLs

### 6.4. Local State (Component-specific)

**Pattern**: `useState` for component-only state

Examples:

- Modal open/close state
- Form field values (managed by React Hook Form)
- Dropdown open state
- Hover states
- Temporary UI flags

### 6.5. Client Preferences (Persisted)

**Storage**: localStorage

**Hook**: `usePreferences.ts`

```typescript
interface Preferences {
  lastUsedCategoryId?: string;
  dismissedHints?: string[];
}

function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(() => loadFromLocalStorage("settlements:preferences"));

  const updatePreference = (key: keyof Preferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveToLocalStorage("settlements:preferences", updated);
  };

  return { prefs, updatePreference };
}
```

---

## 7. Data Flow Patterns

### 7.1. Query Flow (Read Operations)

```
User Action (e.g., navigate to October 2025)
    ↓
Component renders with useDashboard(10, 2025)
    ↓
React Query checks cache
    ├─ HIT (fresh) → Return cached data immediately
    │                Component renders with data
    │
    ├─ HIT (stale) → Return cached data immediately
    │                Background refetch in progress
    │                Component updates when new data arrives
    │
    └─ MISS → Show loading state (skeleton)
              ↓
          Fetch from API: GET /api/dashboard?month=10&year=2025
              ↓
          API endpoint → Supabase service → Database (RLS applied)
              ↓
          Response → React Query cache
              ↓
          Component re-renders with fresh data
```

### 7.2. Mutation Flow (Write Operations)

```
User Action (e.g., create transaction)
    ↓
Form submit → useMutation.mutate(data)
    ↓
onMutate (Optimistic Update)
    ├─ Cancel in-flight queries
    ├─ Snapshot current cache
    ├─ Update cache with optimistic data
    └─ UI updates immediately (perceived instant)
    ↓
API Call: POST /api/transactions
    ↓
API endpoint validates + calls Supabase
    ↓
Database insert (RLS enforced)
    ↓
    ├─ SUCCESS (201 Created)
    │   ↓
    │   onSuccess callback
    │   ├─ Toast: "Transakcja dodana"
    │   └─ Return new transaction data
    │
    └─ ERROR (400/422/500)
        ↓
        onError callback
        ├─ Rollback: restore snapshot
        ├─ Toast: "Nie udało się zapisać"
        └─ Optional: Retry button
    ↓
onSettled (always runs)
    └─ Invalidate queries: ['transactions'], ['dashboard']
        ↓
    Background refetch → ensure consistency
        ↓
    UI shows server truth
```

### 7.3. Cache Invalidation Strategy

**After mutations**:

| Mutation           | Invalidate Queries                            |
| ------------------ | --------------------------------------------- |
| Create Transaction | `transactions`, `dashboard`                   |
| Update Transaction | `transactions`, `dashboard`                   |
| Delete Transaction | `transactions`, `dashboard`                   |
| Create Category    | `categories`                                  |
| Update Category    | `categories`, `transactions` (shows new name) |
| Delete Category    | `categories`, `transactions`, `dashboard`     |

**Manual invalidation**:

- User clicks refresh (future feature)
- Window regains focus (if stale > 30s)
- Network reconnects after offline

---

## 8. API Integration Layer

### 8.1. API Client (`src/lib/api-client.ts`)

```typescript
class ApiClient {
  private baseURL = "/api";

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Handle different status codes
      if (response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = "/?reason=session_expired";
        throw new Error("Unauthorized");
      }

      if (response.status === 403) {
        throw new ApiError("Brak uprawnień", 403);
      }

      if (response.status === 404) {
        throw new ApiError("Nie znaleziono zasobu", 404);
      }

      if (response.status >= 500) {
        throw new ApiError("Błąd serwera", response.status);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.message || "Wystąpił błąd", response.status, error.errors);
      }

      // Success - return data
      if (response.status === 204) {
        return undefined as T; // No content
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;

      // Network error
      throw new ApiError("Sprawdź połączenie internetowe", 0, { network: "offline" });
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
```

### 8.2. Service Layer Example

```typescript
// src/lib/services/transactions.service.ts

export async function fetchTransactions(month: number, year: number, page: number = 1, pageSize: number = 20) {
  return apiClient.get<TransactionsResponse>(
    `/transactions?month=${month}&year=${year}&page=${page}&pageSize=${pageSize}`
  );
}

export async function createTransaction(data: CreateTransactionDto) {
  return apiClient.post<Transaction>("/transactions", data);
}

export async function updateTransaction(id: string, data: UpdateTransactionDto) {
  return apiClient.patch<Transaction>(`/transactions/${id}`, data);
}

export async function deleteTransaction(id: string) {
  return apiClient.delete(`/transactions/${id}`);
}
```

---

## 9. Form Handling Architecture

### 9.1. Validation Schemas

```typescript
// src/lib/schemas/transaction.schema.ts

import { z } from "zod";

export const transactionSchema = z.object({
  amount: z
    .number({ required_error: "Kwota jest wymagana" })
    .positive("Kwota musi być większa od 0")
    .max(999999999.99, "Kwota jest zbyt duża")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), "Maksymalnie 2 miejsca po przecinku"),

  date: z.string({ required_error: "Data jest wymagana" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty"),

  type: z.enum(["income", "expense"], {
    required_error: "Typ jest wymagany",
  }),

  categoryId: z.string({ required_error: "Kategoria jest wymagana" }).uuid("Nieprawidłowa kategoria"),

  note: z.string().max(500, "Notatka może mieć maksymalnie 500 znaków").optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
```

### 9.2. Form Component Pattern

```typescript
// TransactionModal.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema } from '@/lib/schemas';

function TransactionModal({
  mode,
  transaction,
  isOpen,
  onClose
}: TransactionModalProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: mode === 'edit' ? {
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      categoryId: transaction.category.id,
      note: transaction.note || '',
    } : {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const { createMutation, updateMutation } = useTransactionMutations();

  const onSubmit = (data: TransactionFormData) => {
    if (mode === 'create') {
      createMutation.mutate(data, {
        onSuccess: () => {
          onClose();
          form.reset();
        },
      });
    } else {
      updateMutation.mutate(
        { id: transaction.id, data },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields */}
        </form>
      </Form>
    </Dialog>
  );
}
```

---

## 10. Performance Optimizations

### 10.1. Code Splitting Strategy

**Route-level** (automatic with Astro):

- `/` bundle
- `/dashboard` bundle (largest)
- `/settings` bundle

**Component-level** (manual lazy loading):

```typescript
const TransactionModal = lazy(() => import("./TransactionModal"));
const DailyChart = lazy(() => import("./DailyChart"));
const CategoryModal = lazy(() => import("./CategoryModal"));
```

**Library-level** (tree-shaking):

- Lucide React icons: named imports only
- date-fns: import individual functions
- Recharts: code-split with lazy()

### 10.2. Caching Strategy

**Browser HTTP Cache**:

```
Static assets: Cache-Control: public, max-age=31536000, immutable
API responses: Cache-Control: private, no-cache
```

**React Query Cache**:

```typescript
{
  staleTime: {
    dashboard: 30s,
    transactions: 30s,
    categories: 5min,
  },
  cacheTime: {
    all: 5min (garbage collection),
  }
}
```

**Prefetching**:

- Next month data on hover (100ms delay)
- Categories on "Add Transaction" hover
- Page 2 of transactions at 50% scroll

### 10.3. Rendering Optimizations

**Virtualization**: NOT needed for MVP

- Lists capped at reasonable sizes (<100 items per page)
- Infinite scroll pagination handles large datasets

**Memoization**:

```typescript
const MemoizedTransactionItem = memo(TransactionItem, (prev, next) => {
  return prev.transaction.id === next.transaction.id && prev.transaction.updatedAt === next.transaction.updatedAt;
});
```

**Debouncing/Throttling**:

- Search inputs: 300ms debounce
- Scroll events: throttled
- Window resize: throttled (for chart)

---

## 11. Accessibility (a11y) Requirements

### 11.1. WCAG 2.1 Level AA Compliance

**Keyboard Navigation**:

- All interactive elements reachable by Tab
- Visible focus indicators (ring-2 ring-offset-2)
- Modal focus trap
- Escape key closes modals/dialogs
- Arrow keys for navigation (month/year, list items)

**Screen Reader Support**:

- Semantic HTML (`<header>`, `<main>`, `<nav>`, `<section>`)
- ARIA labels on icon-only buttons
- ARIA live regions for toasts (`aria-live="polite"`)
- Form field labels properly associated
- Error announcements

**Color Contrast**:

- Text: minimum 4.5:1 ratio
- Large text (18pt+): minimum 3:1
- UI components: minimum 3:1
- Test with Chrome DevTools contrast checker

**Focus Management**:

- Modal open → focus first field
- Modal close → return focus to trigger
- Delete item → focus next item or previous
- Form submit error → focus first invalid field

**Alternative Text**:

- Illustrations: descriptive alt text
- Icons: aria-label when no visible text
- Chart: data table alternative (sr-only)

### 11.2. Accessibility Testing Checklist

- [ ] Keyboard-only navigation test
- [ ] Screen reader test (NVDA/JAWS)
- [ ] Color contrast verification
- [ ] Focus visible at all times
- [ ] Skip to main content link
- [ ] Form labels and error associations
- [ ] ARIA landmarks present
- [ ] Heading hierarchy logical (h1→h2→h3)
- [ ] Alt text for all images
- [ ] Reduced motion support (`prefers-reduced-motion`)

---

## 12. Error Handling Architecture

### 12.1. Error Boundaries

**Component-level**:

```typescript
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, info) => {
    console.error('Error caught:', error, info);
    // Future: send to error tracking service
  }}
>
  <DashboardContent />
</ErrorBoundary>
```

**Page-level**:

```typescript
// In Layout.astro
<ErrorBoundary
  fallback={
    <div>
      <h1>Coś poszło nie tak</h1>
      <button onClick={() => window.location.reload()}>
        Odśwież stronę
      </button>
    </div>
  }
>
  <slot />
</ErrorBoundary>
```

### 12.2. API Error Handling

**Error Types**:

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string>
  ) {
    super(message);
  }
}
```

**Error Messages Dictionary**:

```typescript
// src/lib/errorMessages.ts

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Sprawdź połączenie internetowe",
  UNAUTHORIZED: "Sesja wygasła. Zaloguj się ponownie",
  FORBIDDEN: "Brak uprawnień do wykonania tej operacji",
  NOT_FOUND: "Nie znaleziono zasobu",
  CONFLICT: "Konflikt danych. Odśwież i spróbuj ponownie",
  SERVER_ERROR: "Błąd serwera. Spróbuj ponownie później",
  VALIDATION_ERROR: "Popraw błędy i spróbuj ponownie",

  // Field-specific
  CATEGORY_EXISTS: "Kategoria o tej nazwie już istnieje",
  CATEGORY_NOT_FOUND: "Kategoria nie istnieje",
  INVALID_AMOUNT: "Kwota musi być większa od 0",
  // ...
};
```

**Global Error Handler** (React Query):

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.message);

          if (error.statusCode === 401) {
            // Redirect to login
            window.location.href = "/?reason=session_expired";
          }
        } else {
          toast.error(ERROR_MESSAGES.NETWORK_ERROR);
        }
      },
    },
  },
});
```

---

## 13. Security Considerations

### 13.1. Authentication & Authorization

**JWT Validation**:

- Middleware validates token on every protected route request
- Token stored in httpOnly cookies (Supabase default)
- Auto-refresh before expiration
- Invalidate on logout

**Row-Level Security (RLS)**:

- All database queries filtered by user_id automatically
- No need for explicit WHERE clauses in API layer
- Enforced at database level (defense in depth)

**API Endpoint Protection**:

```typescript
// src/middleware/index.ts

export async function onRequest(context, next) {
  const { request, url } = context;

  // Public routes
  const publicPaths = ["/", "/reset-password", "/api/auth"];
  if (publicPaths.some((path) => url.pathname.startsWith(path))) {
    return next();
  }

  // Protected routes - verify JWT
  const token = getTokenFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    // Redirect to login
    return Response.redirect(new URL("/", url.origin));
  }

  // Attach user to context
  context.locals.user = user;
  return next();
}
```

### 13.2. Input Validation

**Client-side**:

- Zod schemas for all forms
- Type coercion and sanitization
- Max length enforcement
- Format validation (email, date, UUID)

**Server-side**:

- Re-validate all inputs (never trust client)
- Parameterized queries (Supabase Client prevents SQL injection)
- Rate limiting (future enhancement)
- CSRF protection (Astro default)

### 13.3. XSS Prevention

- React escapes all rendered content by default
- Avoid `dangerouslySetInnerHTML`
- Sanitize user input (notes, category names)
- Content Security Policy headers (future)

---

## 14. Testing Strategy

### 14.1. Unit Tests

**Target**: Utility functions, hooks, services

**Tools**: Vitest + Testing Library

**Coverage Goal**: >80% for utils, 100% for critical business logic

**Example**:

```typescript
// formatCurrency.test.ts

describe("formatCurrency", () => {
  it("formats with Polish locale", () => {
    expect(formatCurrency(1234.56)).toBe("1 234,56 zł");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("0,00 zł");
  });

  it("handles large numbers", () => {
    expect(formatCurrency(1000000)).toBe("1 000 000,00 zł");
  });
});
```

### 14.2. Integration Tests

**Target**: API routes, database interactions, React Query hooks

**Tools**: Vitest + MSW (Mock Service Worker)

**Example**:

```typescript
// useTransactions.test.ts

describe("useTransactions hook", () => {
  it("fetches transactions for given month", async () => {
    const { result } = renderHook(() => useTransactions(10, 2025));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.pages[0].transactions).toHaveLength(20);
  });

  it("handles API errors gracefully", async () => {
    server.use(
      rest.get("/api/transactions", (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const { result } = renderHook(() => useTransactions(10, 2025));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 14.3. Component Tests

**Target**: Complex components (forms, modals, lists)

**Tools**: Vitest + React Testing Library

**Example**:

```typescript
// TransactionModal.test.tsx

describe('TransactionModal', () => {
  it('validates required fields', async () => {
    render(<TransactionModal mode="create" isOpen />);

    const submitButton = screen.getByRole('button', { name: /zapisz/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/kwota jest wymagana/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const onClose = vi.fn();
    render(<TransactionModal mode="create" isOpen onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/kwota/i), '150.50');
    await userEvent.click(screen.getByLabelText(/data/i));
    await userEvent.click(screen.getByText('15')); // Select day
    await userEvent.click(screen.getByLabelText(/kategoria/i));
    await userEvent.click(screen.getByText('Jedzenie'));

    await userEvent.click(screen.getByRole('button', { name: /zapisz/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
```

### 14.4. E2E Tests

**Target**: Critical user flows

**Tools**: Playwright

**Scenarios**:

1. Complete signup → add transaction → view on list → logout
2. Login → navigate months → edit transaction → verify changes
3. Login → create category → delete category → verify reassignment to "Inne"
4. Login → delete account → verify complete removal

**Example**:

```typescript
// e2e/transaction-flow.spec.ts

test("user can add and view transaction", async ({ page }) => {
  // Login
  await page.goto("/");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button:has-text("Zaloguj")');

  // Wait for dashboard
  await page.waitForURL("/dashboard");

  // Open transaction modal
  await page.click('[aria-label="Dodaj transakcję"]');

  // Fill form
  await page.fill('[name="amount"]', "150.75");
  await page.click('[name="category"]');
  await page.click("text=Jedzenie");
  await page.fill('[name="note"]', "Zakupy tygodniowe");

  // Submit
  await page.click('button:has-text("Zapisz")');

  // Verify toast
  await expect(page.locator("text=Transakcja dodana")).toBeVisible();

  // Verify in list
  await expect(page.locator("text=150,75 zł")).toBeVisible();
  await expect(page.locator("text=Jedzenie")).toBeVisible();
});
```

---

## 15. Deployment Architecture

### 15.1. Build Process

```bash
# Production build
npm run build

# Output:
dist/
├── client/        # Static assets (JS, CSS, images)
└── server/        # Server-side code (SSR, API routes)
```

### 15.2. Environment Configuration

**Development** (`.env.development`):

```
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Production** (`.env.production`):

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 15.3. Docker Configuration

```dockerfile
# Dockerfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
```

### 15.4. Hosting (DigitalOcean)

**Platform**: DigitalOcean App Platform

**Configuration**:

- Auto-deploy from GitHub main branch
- Environment variables configured in dashboard
- Health check endpoint: `/api/health`
- Auto-scaling: 1-3 instances based on load

---

## 16. Maintenance & Monitoring

### 16.1. Logging Strategy

**Client-side**:

```typescript
// src/lib/logger.ts

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) console.log("[DEBUG]", ...args);
  },

  info: (...args: any[]) => {
    console.log("[INFO]", ...args);
  },

  error: (message: string, error?: any, context?: any) => {
    console.error("[ERROR]", message, { error, context });

    // Future: send to error tracking service
    // if (!isDev) sendToSentry({ message, error, context });
  },
};
```

**Server-side**:

- Astro logs to stdout
- DigitalOcean captures and stores logs
- Query logs in dashboard

### 16.2. Health Monitoring

**Endpoint**: `/api/health`

```typescript
// src/pages/api/health.ts

export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase.from("categories").select("count").limit(1);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: error.message,
      }),
      { status: 503 }
    );
  }
}
```

### 16.3. Performance Monitoring

**Metrics to Track**:

- Page load time (Lighthouse)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- API response times
- Error rates
- Cache hit rates

**Tools** (future):

- Vercel Analytics / Cloudflare Web Analytics
- Custom performance marks in code

---

## 17. Future Enhancements (Post-MVP)

### 17.1. Planned Features

1. **Advanced Filtering**
   - Filter transactions by category
   - Search by note content
   - Date range selection

2. **Data Export**
   - CSV export of transactions
   - PDF monthly reports
   - Email reports

3. **Budget Planning**
   - Set monthly budget limits per category
   - Alert when approaching limit
   - Budget vs actual comparison

4. **Recurring Transactions**
   - Set up recurring income/expenses
   - Auto-create on schedule
   - Manage subscriptions

5. **Multi-currency Support**
   - Select currency per transaction
   - Exchange rate conversion
   - Multi-currency reports

6. **Mobile Responsiveness**
   - Adaptive layouts for tablet/mobile
   - Touch-optimized interactions
   - Progressive Web App (PWA)

7. **Charts & Analytics**
   - Category breakdown pie chart
   - Monthly trends line chart
   - Year-over-year comparison
   - Spending patterns insights

8. **Receipt Attachments**
   - Upload images/PDFs
   - OCR for auto-fill (future)
   - Gallery view

9. **Collaboration**
   - Shared budgets with partner
   - Permission levels
   - Activity log

10. **Integrations**
    - Bank account sync (OpenBanking API)
    - Calendar integration for planned expenses
    - Slack/email notifications

### 17.2. Technical Debt to Address

- Implement comprehensive E2E test suite
- Add error tracking service (Sentry)
- Set up CI/CD pipeline with automated tests
- Optimize bundle size (code splitting review)
- Add PWA manifest and service worker
- Implement rate limiting on API endpoints
- Add database indexes for performance
- Set up automated backups
- Create admin panel for support
- Implement feature flags system

---

## 18. Appendices

### 18.1. Browser Support

**Minimum supported versions**:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Reasoning**: Modern features used:

- CSS Grid & Flexbox
- ES2020 features
- Intersection Observer API
- ResizeObserver API
- CSS Variables

### 18.2. Dependencies Overview

**Core**:

- `astro`: ^5.0.0
- `react`: ^19.0.0
- `react-dom`: ^19.0.0

**UI & Styling**:

- `tailwindcss`: ^4.0.0
- `@radix-ui/*`: (via Shadcn/ui)
- `lucide-react`: Icons
- `recharts`: Charts

**State & Data**:

- `@tanstack/react-query`: ^5.0.0
- `react-hook-form`: ^7.0.0
- `zod`: ^3.0.0

**Date & Time**:

- `date-fns`: ^3.0.0

**Backend**:

- `@supabase/supabase-js`: ^2.0.0

**Development**:

- `typescript`: ^5.0.0
- `vitest`: ^1.0.0
- `@testing-library/react`: ^14.0.0
- `@playwright/test`: ^1.0.0
- `eslint`: ^9.0.0

### 18.3. Naming Conventions

**Files**:

- Components: PascalCase (`TransactionModal.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Services: camelCase with `.service` suffix (`transactions.service.ts`)
- Types: PascalCase (`Transaction.ts`) or in `types.ts`

**Variables & Functions**:

- camelCase for variables and functions
- PascalCase for components and classes
- UPPER_SNAKE_CASE for constants

**CSS Classes**:

- Tailwind utilities only (no custom class names except in global.css)
- BEM naming for custom classes if needed: `block__element--modifier`

### 18.4. Git Workflow

**Branches**:

- `main`: production-ready code
- `develop`: integration branch
- `feature/*`: new features
- `bugfix/*`: bug fixes
- `hotfix/*`: urgent production fixes

**Commit Messages**:

```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat(transactions): add infinite scroll to transaction list

Implemented intersection observer to automatically load next page
when user scrolls near bottom of list. Improves UX for users with
many transactions.

Closes #42
```

---

## Zakończenie

Niniejszy dokument stanowi kompleksową architekturę UI dla MVP aplikacji Settlements. Definiuje:

✅ **Strukturę projektu** - organizację plików i katalogów  
✅ **Nawigację** - routing i przepływy między stronami  
✅ **Mapy użytkownika** - szczegółowe user flows dla każdej funkcjonalności  
✅ **Komponenty** - hierarchię i specyfikację komponentów React/Astro  
✅ **Zarządzanie stanem** - auth state, server state, URL state, local state  
✅ **Integrację z API** - wzorce data fetching i mutations  
✅ **Formularze** - walidację i obsługę błędów  
✅ **Performance** - code splitting, caching, prefetching  
✅ **Accessibility** - wymagania WCAG 2.1 AA  
✅ **Bezpieczeństwo** - auth, validation, XSS prevention  
✅ **Testowanie** - strategie unit, integration, E2E  
✅ **Deployment** - build, Docker, hosting

Dokument jest gotowy do wykorzystania jako:

- Blueprint dla implementacji
- Dokumentacja dla developerów
- Referencyjna specyfikacja techniczna
- Podstawa do code review

**Następny krok**: Rozpoczęcie implementacji zgodnie z ustalonym planem.
