# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard jest głównym widokiem aplikacji Settlements, służącym do prezentowania podsumowania finansowego użytkownika. Wyświetla zagregowane dane dla wybranego miesiąca i roku, w tym:
- Karty podsumowujące (Przychody, Wydatki, Bilans)
- Wykres słupkowy pokazujący dzienne przychody i wydatki
- Paginowaną listę transakcji z infinite scroll
- Nawigację między miesiącami i latami
- Możliwość dodawania, edycji i usuwania transakcji

Widok jest zoptymalizowany pod kątem desktop (min-width: 1024px) i korzysta wyłącznie z ciemnego motywu.

## 2. Routing widoku

**Ścieżka:** `/dashboard`

**Parametry URL:**
- `month` (query param): numer miesiąca 1-12, domyślnie bieżący miesiąc
- `year` (query param): rok YYYY, domyślnie bieżący rok

**Przykład:** `/dashboard?month=10&year=2025`

**Middleware:** Wymaga autentykacji - chronione przez middleware w `src/middleware/index.ts`

**Przekierowania:**
- Użytkownik niezalogowany → `/` (strona logowania)
- Użytkownik zalogowany bez parametrów → `/dashboard?month={current}&year={current}`

## 3. Struktura komponentów

```
dashboard.astro
└─ AppLayout.astro
   ├─ Header.tsx (client:load)
   │  ├─ Logo
   │  ├─ Navigation Links
   │  └─ User Section
   │
   └─ Main Content
      ├─ OfflineIndicator.tsx (client:idle)
      │
      ├─ DatePeriodNav.tsx (client:load)
      │  ├─ PreviousMonthButton
      │  ├─ CurrentPeriodDisplay
      │  ├─ NextMonthButton
      │  └─ YearSelect
      │
      ├─ ErrorBoundary.tsx (client:load)
      │  └─ DashboardContent.tsx (client:load)
      │     │
      │     ├─ SummaryCards.tsx
      │     │  ├─ SummaryCard (Przychody)
      │     │  ├─ SummaryCard (Wydatki)
      │     │  └─ SummaryCard (Bilans)
      │     │
      │     ├─ DailyChart.tsx (client:visible, lazy)
      │     │  └─ Recharts BarChart
      │     │
      │     ├─ TransactionsList.tsx (client:visible)
      │     │  ├─ EmptyState (warunkowy)
      │     │  ├─ TransactionItem × N
      │     │  ├─ IntersectionObserver trigger
      │     │  └─ LoadingSpinner (inline)
      │     │
      │     └─ FloatingActionButton
      │        └─ Opens TransactionModal
      │
      ├─ TransactionModal.tsx (client:idle, lazy)
      │  ├─ Dialog (Shadcn)
      │  └─ TransactionForm
      │     ├─ TypeToggle
      │     ├─ AmountInput
      │     ├─ DatePicker
      │     ├─ CategorySelect
      │     └─ NoteTextarea
      │
      ├─ DeleteDialog.tsx (client:idle, lazy)
      │  └─ AlertDialog (Shadcn)
      │
      └─ Toaster (client:load)
         └─ Toast notifications (Sonner)
```

## 4. Szczegóły komponentów

### 4.1. DashboardContent.tsx

**Opis:**
Główny kontener zawartości dashboardu. Odpowiedzialny za pobieranie danych z API i zarządzanie stanem dla wszystkich sekcji dashboardu.

**Główne elementy:**
- `<div>` kontener główny z grid layout
- `<SummaryCards />` - sekcja kart podsumowujących
- `<Suspense>` wrapper dla `<DailyChart />`
- `<TransactionsList />` - lista transakcji z infinite scroll
- `<FloatingActionButton />` - przycisk dodawania transakcji

**Obsługiwane interakcje:**
- Kliknięcie FAB → otwiera TransactionModal w trybie "create"
- Automatyczne pobieranie danych przy zmianie month/year w URL

**Obsługiwana walidacja:**
- Brak bezpośredniej walidacji (walidacja w child components)

**Typy:**
- `DashboardSummaryDto` - dane podsumowania z API
- `DatePeriod` - obiekt z month i year
- `DashboardContentProps` - propsy komponentu

**Propsy:**
```typescript
interface DashboardContentProps {
  initialMonth: number;
  initialYear: number;
}
```

### 4.2. DatePeriodNav.tsx

**Opis:**
Komponent nawigacji pozwalający na zmianę wyświetlanego okresu (miesiąc i rok). Synchronizuje się z parametrami URL.

**Główne elementy:**
- `<div>` kontener flex
- `<Button>` - przycisk poprzedniego miesiąca (ikona strzałki w lewo)
- `<span>` - wyświetlanie aktualnego okresu np. "Październik 2025"
- `<Button>` - przycisk następnego miesiąca (ikona strzałki w prawo, disabled dla przyszłych miesięcy)
- `<Select>` - dropdown wyboru roku

**Obsługiwane interakcje:**
- Click poprzedni miesiąc → aktualizacja URL params, przejście do poprzedniego miesiąca
- Click następny miesiąc → aktualizacja URL params, przejście do następnego miesiąca
- Zmiana roku w select → aktualizacja URL params, przejście do stycznia wybranego roku
- Keyboard: strzałka lewo/prawo dla nawigacji między miesiącami

**Obsługiwana walidacja:**
- Przycisk "następny miesiąc" disabled gdy `month === currentMonth && year === currentYear`
- Rok nie może być większy niż aktualny rok + 1

**Typy:**
- `DatePeriod` - obiekt z month i year
- `DatePeriodNavProps` - propsy komponentu

**Propsy:**
```typescript
interface DatePeriodNavProps {
  // Brak propsów - używa custom hooka useDatePeriod
}
```

### 4.3. SummaryCards.tsx

**Opis:**
Kontener dla trzech kart podsumowujących dane finansowe: Przychody, Wydatki i Bilans.

**Główne elementy:**
- `<div>` kontener grid (3 kolumny)
- `<SummaryCard variant="income" />` - karta przychodów (zielony akcent)
- `<SummaryCard variant="expenses" />` - karta wydatków (czerwony akcent)
- `<SummaryCard variant="balance" />` - karta bilansu (dynamiczny kolor)

**Obsługiwane interakcje:**
- Brak bezpośrednich interakcji (tylko wyświetlanie)

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `SummaryCardsProps` - propsy z danymi podsumowania
- `SummaryData` - dane do wyświetlenia

**Propsy:**
```typescript
interface SummaryCardsProps {
  income: number;
  expenses: number;
  balance: number;
  isLoading?: boolean;
}
```

### 4.4. SummaryCard.tsx

**Opis:**
Pojedyncza karta wyświetlająca wartość finansową z etykietą i ikoną.

**Główne elementy:**
- `<Card>` (Shadcn) - kontener karty
- `<CardHeader>` - nagłówek z ikoną i tytułem
- `<CardContent>` - główna wartość sformatowana jako waluta PLN

**Obsługiwane interakcje:**
- Brak interakcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `SummaryCardProps` - propsy komponentu
- `SummaryCardVariant` - typ wariantu karty

**Propsy:**
```typescript
type SummaryCardVariant = 'income' | 'expenses' | 'balance';

interface SummaryCardProps {
  variant: SummaryCardVariant;
  value: number;
  isLoading?: boolean;
}
```

### 4.5. DailyChart.tsx

**Opis:**
Wykres słupkowy (Recharts BarChart) wizualizujący dzienne przychody i wydatki w wybranym miesiącu.

**Główne elementy:**
- `<ResponsiveContainer>` - wrapper dla responsive chart
- `<BarChart>` - główny komponent wykresu
- `<CartesianGrid>` - siatka
- `<XAxis>` - oś X z datami
- `<YAxis>` - oś Y z kwotami
- `<Tooltip>` - customowy tooltip w dark theme
- `<Legend>` - legenda
- `<Bar dataKey="income">` - słupki przychodów (zielone)
- `<Bar dataKey="expenses">` - słupki wydatków (czerwone)

**Obsługiwane interakcje:**
- Hover na słupku → wyświetlenie tooltipa z wartością
- Brak klikania (przyszłe: drill-down)

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `DailyChartProps` - propsy komponentu
- `DailyBreakdownData` - dane dla wykresu

**Propsy:**
```typescript
interface DailyBreakdownData {
  date: string; // YYYY-MM-DD
  income: number;
  expenses: number;
}

interface DailyChartProps {
  data: DailyBreakdownData[];
  isLoading?: boolean;
}
```

### 4.6. TransactionsList.tsx

**Opis:**
Lista transakcji z infinite scroll. Wyświetla transakcje dla wybranego miesiąca/roku w porządku chronologicznym malejącym.

**Główne elementy:**
- `<div>` kontener listy
- `<EmptyState />` - wyświetlany gdy brak transakcji (warunkowy)
- `<TransactionItem />` × N - poszczególne elementy listy
- `<div ref={observerRef}>` - element trigger dla intersection observer
- `<LoadingSpinner />` - spinner podczas ładowania następnej strony
- `<p>` - komunikat końca listy "To wszystkie transakcje"

**Obsługiwane interakcje:**
- Scroll w dół → automatyczne ładowanie kolejnej strony (infinite scroll)
- Click edit na transakcji → otwiera TransactionModal w trybie "edit"
- Click delete na transakcji → otwiera DeleteDialog

**Obsługiwana walidacja:**
- Brak bezpośredniej walidacji

**Typy:**
- `TransactionsListProps` - propsy komponentu
- `TransactionDto[]` - lista transakcji

**Propsy:**
```typescript
interface TransactionsListProps {
  month: number;
  year: number;
  onEditTransaction: (transaction: TransactionDto) => void;
  onDeleteTransaction: (transactionId: string) => void;
}
```

### 4.7. TransactionItem.tsx

**Opis:**
Pojedynczy element listy transakcji wyświetlający szczegóły transakcji i akcje (edit, delete).

**Główne elementy:**
- `<div>` kontener item z hover effect
- `<div>` - sekcja daty (format DD.MM)
- `<Badge>` - badge kategorii z ikoną
- `<span>` - kwota (sformatowana, kolorowana: zielona dla income, czerwona dla expense)
- `<Tooltip>` - tooltip z notatką (jeśli istnieje)
- `<div>` - akcje (widoczne on hover)
  - `<Button>` - ikona edycji
  - `<Button>` - ikona usunięcia

**Obsługiwane interakcje:**
- Hover → pokazanie przycisków akcji
- Click edit button → wywołanie onEdit callback
- Click delete button → wywołanie onDelete callback
- Focus + Enter → wywołanie onEdit
- Focus + Delete → wywołanie onDelete
- Hover na ikonie notatki → tooltip z treścią

**Obsługiwana walidacja:**
- Brak walidacji (tylko wyświetlanie)

**Typy:**
- `TransactionItemProps` - propsy komponentu
- `TransactionDto` - obiekt transakcji

**Propsy:**
```typescript
interface TransactionItemProps {
  transaction: TransactionDto;
  onEdit: (transaction: TransactionDto) => void;
  onDelete: (transactionId: string) => void;
}
```

### 4.8. TransactionModal.tsx

**Opis:**
Modal dodawania lub edycji transakcji z formularzem. Używa React Hook Form + Zod do walidacji.

**Główne elementy:**
- `<Dialog>` (Shadcn) - kontener modalu
- `<DialogHeader>` - nagłówek z tytułem ("Dodaj transakcję" / "Edytuj transakcję")
- `<DialogContent>` - zawartość z formularzem
- `<Form>` - wrapper formularza (React Hook Form)
- `<Tabs>` - toggle typu (Przychód/Wydatek)
- `<FormField name="amount">` - pole kwoty z formatowaniem walutowym
- `<FormField name="date">` - date picker (Popover + Calendar)
- `<FormField name="categoryId">` - select kategorii (searchable dropdown)
- `<FormField name="note">` - textarea notatki (opcjonalne, max 500 znaków z licznikiem)
- `<DialogFooter>` - przyciski akcji
  - `<Button variant="ghost">` - Anuluj
  - `<Button type="submit">` - Zapisz (disabled podczas submitu lub błędów walidacji)

**Obsługiwane interakcje:**
- Submit formularza → walidacja Zod → API call (create lub update)
- Click Anuluj / Escape / Backdrop → próba zamknięcia (z alertem jeśli formularz dirty)
- Zmiana typu transakcji → reset kategorii (opcjonalne)
- Zmiana amount → auto-formatowanie na ##,## zł
- Keyboard: Ctrl+Enter → submit

**Obsługiwana walidacja (Zod schema):**
```typescript
{
  amount: {
    required: true,
    positive: true,
    max_decimals: 2,
    max_value: 999999999.99
  },
  date: {
    required: true,
    format: "YYYY-MM-DD",
    valid_date: true
  },
  categoryId: {
    required: true,
    uuid: true,
    exists: true (weryfikowane przez API)
  },
  type: {
    required: true,
    enum: ["income", "expense"]
  },
  note: {
    optional: true,
    max_length: 500
  }
}
```

**Typy:**
- `TransactionModalProps` - propsy komponentu
- `TransactionFormData` - dane formularza (Zod infer)
- `TransactionModalMode` - tryb modalu

**Propsy:**
```typescript
type TransactionModalMode = 'create' | 'edit';

interface TransactionModalProps {
  mode: TransactionModalMode;
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDto; // wymagane dla mode="edit"
  defaultDate?: string; // opcjonalnie dla mode="create"
}
```

### 4.9. DeleteDialog.tsx

**Opis:**
Dialog potwierdzenia usunięcia transakcji.

**Główne elementy:**
- `<AlertDialog>` (Shadcn) - kontener alertu
- `<AlertDialogHeader>` - nagłówek z tytułem
- `<AlertDialogDescription>` - opis z podsumowaniem transakcji do usunięcia
- `<AlertDialogFooter>` - przyciski
  - `<Button variant="ghost">` - Anuluj
  - `<Button variant="destructive">` - Usuń (z loading state)

**Obsługiwane interakcje:**
- Click Usuń → API call DELETE → zamknięcie dialogu → toast notification
- Click Anuluj / Escape → zamknięcie bez akcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `DeleteDialogProps` - propsy komponentu

**Propsy:**
```typescript
interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDto;
  onConfirm: (transactionId: string) => Promise<void>;
}
```

### 4.10. FloatingActionButton.tsx

**Opis:**
Przycisk floating action button (FAB) do szybkiego dodawania transakcji.

**Główne elementy:**
- `<Button>` - okrągły przycisk z ikoną "+"
- Pozycjonowany fixed, bottom-right

**Obsługiwane interakcje:**
- Click → otwiera TransactionModal w trybie "create"
- Keyboard: Ctrl+K → otwiera modal (global shortcut)

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `FloatingActionButtonProps` - propsy komponentu

**Propsy:**
```typescript
interface FloatingActionButtonProps {
  onClick: () => void;
}
```

### 4.11. EmptyState.tsx

**Opis:**
Komponent wyświetlany gdy brak transakcji w danym miesiącu.

**Główne elementy:**
- `<div>` kontener wyśrodkowany
- SVG ilustracja (opcjonalne)
- `<h3>` - tytuł "Nie masz jeszcze żadnych transakcji w tym miesiącu"
- `<p>` - opis zachęcający
- `<Button>` - CTA "Dodaj pierwszą transakcję"

**Obsługiwane interakcje:**
- Click CTA → otwiera TransactionModal

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `EmptyStateProps` - propsy komponentu

**Propsy:**
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

## 5. Typy

### 5.1. Typy z API (z types.ts)

```typescript
// Już zdefiniowane w types.ts
export interface DashboardSummaryDto {
  summary: {
    income: number;
    expenses: number;
    balance: number;
  };
  dailyBreakdown: {
    date: string; // YYYY-MM-DD
    income: number;
    expenses: number;
  }[];
}

export type TransactionDto = {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  note: string | null;
  createdAt: string; // ISO timestamp
  category: {
    id: string;
    name: string;
  } | null;
};

export interface ListTransactionsResponseDto {
  transactions: TransactionDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export type CreateTransactionCommand = {
  amount: number;
  date: string;
  categoryId: string;
  type: 'income' | 'expense';
  note?: string | null;
};
```

### 5.2. Nowe typy ViewModels

```typescript
// src/lib/types/dashboard.types.ts

/**
 * Obiekt reprezentujący wybrany okres (miesiąc i rok)
 */
export interface DatePeriod {
  month: number; // 1-12
  year: number; // np. 2025
}

/**
 * Typ wariantu dla karty podsumowania
 */
export type SummaryCardVariant = 'income' | 'expenses' | 'balance';

/**
 * Tryb działania TransactionModal
 */
export type TransactionModalMode = 'create' | 'edit';

/**
 * Dane formularza transakcji (przed wysłaniem do API)
 */
export interface TransactionFormData {
  amount: number;
  date: string;
  categoryId: string;
  type: 'income' | 'expense';
  note?: string;
}

/**
 * Stan modalu transakcji
 */
export interface TransactionModalState {
  isOpen: boolean;
  mode: TransactionModalMode;
  transaction?: TransactionDto;
}

/**
 * Stan dialogu usuwania
 */
export interface DeleteDialogState {
  isOpen: boolean;
  transaction?: TransactionDto;
}

/**
 * Dane dla pojedynczego dnia w wykresie
 */
export interface DailyChartDataPoint {
  date: string; // DD
  fullDate: string; // YYYY-MM-DD
  income: number;
  expenses: number;
}

/**
 * Kategoria z licznikiem transakcji (dla select dropdown)
 */
export interface CategoryWithCount {
  id: string;
  name: string;
  transactionCount?: number;
}
```

### 5.3. Typy dla Props komponentów

```typescript
// Props dla głównych komponentów

export interface DashboardContentProps {
  initialMonth: number;
  initialYear: number;
}

export interface DatePeriodNavProps {
  // używa useDatePeriod hook - brak propsów
}

export interface SummaryCardsProps {
  income: number;
  expenses: number;
  balance: number;
  isLoading?: boolean;
}

export interface SummaryCardProps {
  variant: SummaryCardVariant;
  value: number;
  isLoading?: boolean;
}

export interface DailyChartProps {
  data: DailyChartDataPoint[];
  isLoading?: boolean;
}

export interface TransactionsListProps {
  month: number;
  year: number;
  onEditTransaction: (transaction: TransactionDto) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export interface TransactionItemProps {
  transaction: TransactionDto;
  onEdit: (transaction: TransactionDto) => void;
  onDelete: (transactionId: string) => void;
}

export interface TransactionModalProps {
  mode: TransactionModalMode;
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDto;
  defaultDate?: string;
}

export interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDto;
  onConfirm: (transactionId: string) => Promise<void>;
}

export interface FloatingActionButtonProps {
  onClick: () => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}
```

## 6. Zarządzanie stanem

### 6.1. URL State (Source of Truth dla month/year)

Parametry URL są głównym źródłem prawdy dla wybranego okresu:

**Custom Hook: `useDatePeriod`**
```typescript
// src/lib/hooks/useDatePeriod.ts

import { useSearchParams } from 'react-router-dom'; // lub odpowiednik w Astro
import { useMemo, useCallback } from 'react';

export function useDatePeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Pobierz aktualny miesiąc i rok z URL lub użyj bieżącego
  const period = useMemo((): DatePeriod => {
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
    
    return { month, year };
  }, [searchParams]);
  
  const setPeriod = useCallback((newPeriod: DatePeriod) => {
    setSearchParams({ 
      month: String(newPeriod.month), 
      year: String(newPeriod.year) 
    });
  }, [setSearchParams]);
  
  const nextMonth = useCallback(() => {
    const { month, year } = period;
    if (month === 12) {
      setPeriod({ month: 1, year: year + 1 });
    } else {
      setPeriod({ month: month + 1, year });
    }
  }, [period, setPeriod]);
  
  const prevMonth = useCallback(() => {
    const { month, year } = period;
    if (month === 1) {
      setPeriod({ month: 12, year: year - 1 });
    } else {
      setPeriod({ month: month - 1, year });
    }
  }, [period, setPeriod]);
  
  const setYear = useCallback((newYear: number) => {
    setPeriod({ month: 1, year: newYear });
  }, [setPeriod]);
  
  return {
    period,
    setPeriod,
    nextMonth,
    prevMonth,
    setYear,
  };
}
```

### 6.2. Server State (React Query)

Zarządzanie danymi z API przy użyciu React Query:

**Custom Hook: `useDashboard`**
```typescript
// src/lib/hooks/useDashboard.ts

import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '@/lib/services/dashboard.service';

export function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', { month, year }],
    queryFn: () => fetchDashboardSummary(month, year),
    staleTime: 30_000, // 30 sekund
    refetchOnWindowFocus: false,
  });
}
```

**Custom Hook: `useTransactions`**
```typescript
// src/lib/hooks/useTransactions.ts

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTransactions } from '@/lib/services/transactions.service';

export function useTransactions(month: number, year: number) {
  return useInfiniteQuery({
    queryKey: ['transactions', { month, year }],
    queryFn: ({ pageParam = 1 }) => 
      fetchTransactions(month, year, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
```

**Custom Hook: `useTransactionMutations`**
```typescript
// src/lib/hooks/useTransactionMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '@/lib/services/transactions.service';
import { toast } from 'sonner';

export function useTransactionMutations() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transakcja dodana pomyślnie');
    },
    onError: (error) => {
      toast.error('Nie udało się dodać transakcji');
      console.error('Create transaction error:', error);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionCommand }) => 
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transakcja zaktualizowana pomyślnie');
    },
    onError: (error) => {
      toast.error('Nie udało się zaktualizować transakcji');
      console.error('Update transaction error:', error);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transakcja usunięta pomyślnie');
    },
    onError: (error) => {
      toast.error('Nie udało się usunąć transakcji');
      console.error('Delete transaction error:', error);
    },
  });
  
  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
```

### 6.3. Local Component State (useState)

**Stan modali:**
```typescript
// W DashboardContent.tsx

const [transactionModalState, setTransactionModalState] = useState<TransactionModalState>({
  isOpen: false,
  mode: 'create',
  transaction: undefined,
});

const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
  isOpen: false,
  transaction: undefined,
});
```

### 6.4. Categories State

**Custom Hook: `useCategories`**
```typescript
// src/lib/hooks/useCategories.ts

import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/lib/services/categories.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 300_000, // 5 minut - kategorie zmieniają się rzadko
    refetchOnWindowFocus: false,
  });
}
```

## 7. Integracja API

### 7.1. Dashboard Summary Endpoint

**Endpoint:** `GET /api/dashboard`

**Query Parameters:**
- `month`: number (1-12)
- `year`: number (YYYY)

**Request:**
```typescript
// src/lib/services/dashboard.service.ts

export async function fetchDashboardSummary(
  month: number, 
  year: number
): Promise<DashboardSummaryDto> {
  const response = await fetch(
    `/api/dashboard?month=${month}&year=${year}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch dashboard');
  }
  
  return response.json();
}
```

**Response Type:** `DashboardSummaryDto`

**Error Handling:**
- 400: Nieprawidłowe parametry → toast z komunikatem
- 401: Brak autoryzacji → redirect do logowania
- 500: Błąd serwera → toast z komunikatem

### 7.2. List Transactions Endpoint

**Endpoint:** `GET /api/transactions`

**Query Parameters:**
- `month`: number (1-12)
- `year`: number (YYYY)
- `page`: number (default: 1)
- `pageSize`: number (default: 20)

**Request:**
```typescript
// src/lib/services/transactions.service.ts

export async function fetchTransactions(
  month: number,
  year: number,
  page: number = 1,
  pageSize: number = 20
): Promise<ListTransactionsResponseDto> {
  const response = await fetch(
    `/api/transactions?month=${month}&year=${year}&page=${page}&pageSize=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch transactions');
  }
  
  return response.json();
}
```

**Response Type:** `ListTransactionsResponseDto`

### 7.3. Create Transaction Endpoint

**Endpoint:** `POST /api/transactions`

**Request Body Type:** `CreateTransactionCommand`

**Request:**
```typescript
export async function createTransaction(
  data: CreateTransactionCommand
): Promise<TransactionDto> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Handle specific error codes
    if (response.status === 422) {
      throw new Error('Kategoria nie istnieje lub nie należy do użytkownika');
    }
    
    throw new Error(error.message || 'Failed to create transaction');
  }
  
  return response.json();
}
```

**Response Type:** `TransactionDto`

**Error Handling:**
- 400: Błędy walidacji → wyświetlenie błędów przy polach formularza
- 422: Nieprawidłowa kategoria → toast z komunikatem
- 401: Brak autoryzacji → redirect do logowania
- 500: Błąd serwera → toast z komunikatem

### 7.4. Update Transaction Endpoint

**Endpoint:** `PATCH /api/transactions/{id}`

**Path Parameter:** `id` (string, UUID)

**Request Body Type:** `UpdateTransactionCommand`

**Request:**
```typescript
export async function updateTransaction(
  id: string,
  data: UpdateTransactionCommand
): Promise<TransactionDto> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 404) {
      throw new Error('Transakcja nie została znaleziona');
    }
    
    if (response.status === 403) {
      throw new Error('Brak uprawnień do edycji tej transakcji');
    }
    
    throw new Error(error.message || 'Failed to update transaction');
  }
  
  return response.json();
}
```

**Response Type:** `TransactionDto`

### 7.5. Delete Transaction Endpoint

**Endpoint:** `DELETE /api/transactions/{id}`

**Path Parameter:** `id` (string, UUID)

**Request:**
```typescript
export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 404) {
      throw new Error('Transakcja nie została znaleziona');
    }
    
    if (response.status === 403) {
      throw new Error('Brak uprawnień do usunięcia tej transakcji');
    }
    
    throw new Error(error.message || 'Failed to delete transaction');
  }
}
```

**Response:** 204 No Content (void)

### 7.6. List Categories Endpoint

**Endpoint:** `GET /api/categories`

**Request:**
```typescript
// src/lib/services/categories.service.ts

export async function fetchCategories(): Promise<CategoryDto[]> {
  const response = await fetch('/api/categories', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch categories');
  }
  
  return response.json();
}
```

**Response Type:** `CategoryDto[]`

## 8. Interakcje użytkownika

### 8.1. Nawigacja między miesiącami

**Interakcja:**
1. Użytkownik klika przycisk "←" (poprzedni miesiąc)
2. Hook `useDatePeriod` aktualizuje parametry URL
3. React Query wykrywa zmianę query key
4. Automatyczne pobranie danych dla nowego miesiąca
5. Wszystkie komponenty (SummaryCards, DailyChart, TransactionsList) aktualizują się

**Warunki:**
- Przycisk "→" (następny miesiąc) disabled jeśli `month === currentMonth && year === currentYear`

**Keyboard shortcuts:**
- Strzałka w lewo → poprzedni miesiąc
- Strzałka w prawo → następny miesiąc (jeśli dostępny)

### 8.2. Zmiana roku

**Interakcja:**
1. Użytkownik klika dropdown roku
2. Wybiera rok z listy
3. Hook `useDatePeriod.setYear()` ustawia URL na `?month=1&year={selectedYear}`
4. Automatyczne pobranie danych dla stycznia wybranego roku

### 8.3. Dodawanie transakcji

**Flow:**
1. Użytkownik klika FAB "+" lub naciśnie Ctrl+K
2. Otwiera się `TransactionModal` w trybie `mode="create"`
3. Użytkownik wypełnia formularz:
   - Wybiera typ (Przychód/Wydatek) - domyślnie Wydatek
   - Wpisuje kwotę - auto-formatowanie do ##,## zł
   - Wybiera datę - domyślnie dzisiejsza data
   - Wybiera kategorię z dropdown
   - Opcjonalnie dodaje notatkę (max 500 znaków)
4. Real-time walidacja Zod przy każdej zmianie pola
5. Przycisk "Zapisz" disabled jeśli błędy walidacji lub submitting
6. Click "Zapisz" lub Ctrl+Enter:
   - Walidacja formularza
   - Wywołanie `createMutation.mutate(data)`
   - Pokazanie loading state na przycisku
   - Po sukcesie: zamknięcie modalu, toast, invalidacja queries
   - Po błędzie: toast z komunikatem, modal pozostaje otwarty

**Obsługa unsaved changes:**
- Jeśli formularz jest "dirty" (ma zmiany) i użytkownik próbuje zamknąć modal:
  - Pokazanie AlertDialog: "Masz niezapisane zmiany. Zamknąć?"
  - Przyciski: [Anuluj] [Odrzuć zmiany]

### 8.4. Edycja transakcji

**Flow:**
1. Użytkownik hover na `TransactionItem`
2. Pokazują się przyciski akcji
3. Click na ikonę edycji
4. Otwiera się `TransactionModal` w trybie `mode="edit"` z pre-filled danymi
5. Użytkownik modyfikuje pola
6. Submit → wywołanie `updateMutation.mutate({ id, data })`
7. Po sukcesie: zamknięcie modalu, toast, invalidacja queries

**Keyboard alternative:**
- Focus na TransactionItem + Enter → otwiera modal edycji

### 8.5. Usuwanie transakcji

**Flow:**
1. Użytkownik hover na `TransactionItem`
2. Click na ikonę usunięcia
3. Otwiera się `DeleteDialog` z podsumowaniem transakcji
4. Użytkownik klika "Usuń"
5. Wywołanie `deleteMutation.mutate(id)`
6. Loading state na przycisku
7. Po sukcesie: zamknięcie dialogu, toast, invalidacja queries
8. Transakcja fade out z listy

**Keyboard alternative:**
- Focus na TransactionItem + Delete key → otwiera dialog usuwania

### 8.6. Infinite scroll

**Flow:**
1. Użytkownik scrolluje listę transakcji w dół
2. IntersectionObserver wykrywa zbliżenie się do końca (3 elementy od dołu)
3. Wywołanie `fetchNextPage()` z React Query infinite query
4. Pokazanie inline spinnera na dole listy
5. Po pobraniu danych: append do listy, ukrycie spinnera
6. Kontynuacja obserwacji dla kolejnych stron
7. Gdy `hasNextPage === false`: pokazanie komunikatu "To wszystkie transakcje"

**Error handling:**
- Jeśli fetch next page fail: toast z komunikatem + przycisk "Spróbuj ponownie"

### 8.7. Wyświetlanie notatki

**Interakcja:**
1. Użytkownik hover myszką na ikonę notatki przy transakcji
2. Pokazanie Tooltip z treścią notatki
3. Tooltip auto-hide po opuszczeniu ikony

## 9. Warunki i walidacja

### 9.1. Walidacja formularza transakcji (Zod)

**Schema lokalizacja:** `src/lib/schemas/transaction.schema.ts`

```typescript
export const transactionFormSchema = z.object({
  amount: z
    .number({ required_error: 'Kwota jest wymagana' })
    .positive('Kwota musi być większa od 0')
    .max(999999999.99, 'Kwota jest zbyt duża')
    .refine(
      (val) => {
        const decimals = val.toString().split('.')[1];
        return !decimals || decimals.length <= 2;
      },
      'Maksymalnie 2 miejsca po przecinku'
    ),
  
  date: z
    .string({ required_error: 'Data jest wymagana' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty')
    .refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowa data'),
  
  categoryId: z
    .string({ required_error: 'Kategoria jest wymagana' })
    .uuid('Nieprawidłowa kategoria'),
  
  type: z.enum(['income', 'expense'], {
    required_error: 'Typ jest wymagany',
  }),
  
  note: z
    .string()
    .max(500, 'Notatka może mieć maksymalnie 500 znaków')
    .optional()
    .nullable(),
});
```

**Komponenty dotkwięte:** `TransactionModal.tsx`

**Wpływ na UI:**
- Błędy walidacji wyświetlane pod polami formularza w czerwonym kolorze
- Przycisk "Zapisz" disabled gdy `!form.formState.isValid || form.formState.isSubmitting`
- Focus na pierwszym polu z błędem po próbie submitu

### 9.2. Warunki query parameters

**Walidacja w URL:**
- `month` musi być liczbą 1-12
- `year` musi być liczbą 1900-2100
- Jeśli brak lub nieprawidłowe: użycie bieżącego miesiąca/roku jako fallback

**Komponenty dotknięte:** `DatePeriodNav.tsx`, `DashboardContent.tsx`

### 9.3. Warunki nawigacji

**Przycisk "następny miesiąc":**
- Disabled gdy: `currentPeriod.month === now.getMonth() + 1 && currentPeriod.year === now.getFullYear()`
- Wizualnie: opacity-50, cursor-not-allowed

**Select roku:**
- Lista lat od `currentYear - 5` do `currentYear`
- Sortowanie malejące (najnowsze na górze)

### 9.4. Warunki wyświetlania

**EmptyState:**
- Pokazany gdy: `transactions.length === 0 && !isLoading`
- Ukryty gdy: `transactions.length > 0 || isLoading`

**LoadingSkeleton:**
- Pokazany podczas initial load: `isLoading && !data`
- Dla SummaryCards, DailyChart, TransactionsList

**Inline Spinner (infinite scroll):**
- Pokazany gdy: `isFetchingNextPage === true`

**"To wszystkie transakcje" message:**
- Pokazany gdy: `!hasNextPage && transactions.length > 0`

### 9.5. Warunki kolorowania

**SummaryCard Bilans:**
- Zielony (`text-green-500`, `bg-green-500/10`): gdy `balance >= 0`
- Czerwony (`text-red-500`, `bg-red-500/10`): gdy `balance < 0`

**TransactionItem kwota:**
- Zielony: `type === 'income'`
- Czerwony: `type === 'expense'`

## 10. Obsługa błędów

### 10.1. Błędy API

**Error Boundary:**
- Komponent `ErrorBoundary.tsx` opakowuje `DashboardContent`
- Catch: błędy renderowania React
- Fallback UI: komunikat błędu + przycisk "Odśwież stronę"

**Query Errors (React Query):**

```typescript
// W useDashboard.ts
{
  onError: (error) => {
    if (error.message.includes('401')) {
      // Redirect do logowania
      window.location.href = '/?reason=session_expired';
    } else {
      toast.error('Nie udało się pobrać danych dashboardu');
    }
  }
}
```

**Mutation Errors:**
- Create transaction fail: toast "Nie udało się dodać transakcji" + modal pozostaje otwarty
- Update transaction fail: toast "Nie udało się zaktualizować transakcji" + modal pozostaje otwarty
- Delete transaction fail: toast "Nie udało się usunąć transakcji" + dialog pozostaje otwarty

**Specific HTTP Error Codes:**

| Kod | Znaczenie | Akcja |
|-----|-----------|-------|
| 400 | Błędy walidacji | Wyświetlenie błędów przy polach formularza |
| 401 | Brak autoryzacji | Redirect do `/` + toast "Sesja wygasła" |
| 403 | Brak uprawnień | Toast "Brak uprawnień do tej operacji" |
| 404 | Nie znaleziono | Toast "Zasób nie został znaleziony" |
| 422 | Nieprawidłowa kategoria | Toast "Kategoria nie istnieje lub nie należy do użytkownika" |
| 500 | Błąd serwera | Toast "Błąd serwera. Spróbuj ponownie później" |

### 10.2. Błędy walidacji formularza

**Obsługa:**
- React Hook Form + Zod zapewniają automatyczną walidację
- Błędy wyświetlane pod polami w `<FormMessage>` (Shadcn)
- Czerwone obramowanie pól z błędami
- Przycisk submit disabled gdy błędy

**Przykład wyświetlania błędu:**
```tsx
<FormField
  control={form.control}
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Kwota</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Automatycznie pokazuje błędy z Zod */}
    </FormItem>
  )}
/>
```

### 10.3. Błędy sieci

**Offline detection:**
- Komponent `OfflineIndicator.tsx` na górze strony
- Nasłuchuje na `window.offline` event
- Pokazuje banner: "Brak połączenia z internetem"

**Retry mechanism:**
- React Query automatycznie retry 1 raz dla queries
- Dla mutations: brak auto-retry, użytkownik musi spróbować ponownie

### 10.4. Race conditions

**Scenariusz:** Użytkownik szybko zmienia miesiące

**Rozwiązanie:**
- React Query automatycznie canceluje in-flight requests przy zmianie query key
- Tylko najnowsze zapytanie jest processed

### 10.5. Stale data

**Scenariusz:** Dane się zmieniły w innej karcie/urządzeniu

**Rozwiązanie:**
- `staleTime: 30_000` - dane uznawane za świeże przez 30s
- Po tym czasie: background refetch przy window focus
- Użytkownik może ręcznie refresh (przyszła funkcja)

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1.1. Utwórz katalogi:
```
src/components/dashboard/
src/components/shared/
src/lib/hooks/
src/lib/services/
src/lib/schemas/
src/lib/types/
```

1.2. Utwórz plik strony:
```
src/pages/dashboard.astro
```

1.3. Utwórz pliki layoutów (jeśli nie istnieją):
```
src/layouts/AppLayout.astro
```

### Krok 2: Definicja typów

2.1. Utwórz plik `src/lib/types/dashboard.types.ts` z typami ViewModels:
- `DatePeriod`
- `SummaryCardVariant`
- `TransactionModalMode`
- `TransactionFormData`
- `TransactionModalState`
- `DeleteDialogState`
- `DailyChartDataPoint`

2.2. Utwórz interfejsy Props dla wszystkich komponentów

### Krok 3: Schema walidacji

3.1. Utwórz `src/lib/schemas/transaction.schema.ts`:
- Zdefiniuj `transactionFormSchema` z Zod
- Export schema i type inference

### Krok 4: Custom Hooks

4.1. Utwórz `src/lib/hooks/useDatePeriod.ts`:
- Implementuj logikę zarządzania URL params
- Export funkcji: `nextMonth`, `prevMonth`, `setYear`

4.2. Utwórz `src/lib/hooks/useDashboard.ts`:
- Implementuj React Query hook dla dashboard summary

4.3. Utwórz `src/lib/hooks/useTransactions.ts`:
- Implementuj React Query infinite query dla transakcji

4.4. Utwórz `src/lib/hooks/useTransactionMutations.ts`:
- Implementuj mutations dla create/update/delete
- Dodaj invalidation queries
- Dodaj toast notifications

4.5. Utwórz `src/lib/hooks/useCategories.ts`:
- Implementuj React Query hook dla kategorii

### Krok 5: Service Layer

5.1. Dodaj funkcje do `src/lib/services/dashboard.service.ts`:
- `fetchDashboardSummary(month, year)`

5.2. Dodaj funkcje do `src/lib/services/transactions.service.ts`:
- `fetchTransactions(month, year, page, pageSize)`
- `createTransaction(data)`
- `updateTransaction(id, data)`
- `deleteTransaction(id)`

5.3. Utwórz `src/lib/services/categories.service.ts`:
- `fetchCategories()`

### Krok 6: Komponenty pomocnicze (Shared)

6.1. Utwórz `src/components/shared/LoadingSkeleton.tsx`:
- Implementuj szkielety dla cards, chart, list

6.2. Utwórz `src/components/shared/EmptyState.tsx`:
- Komponent z ilustracją, tytułem, opisem, CTA

6.3. Utwórz `src/components/shared/OfflineIndicator.tsx`:
- Banner offline detection

### Krok 7: Komponenty Dashboard - część 1 (Podstawowe)

7.1. Utwórz `src/components/dashboard/DatePeriodNav.tsx`:
- Implementuj nawigację miesiąc/rok
- Użyj hooka `useDatePeriod`
- Dodaj keyboard shortcuts

7.2. Utwórz `src/components/dashboard/SummaryCard.tsx`:
- Implementuj pojedynczą kartę
- Dodaj variant logic (kolory)
- Dodaj loading skeleton

7.3. Utwórz `src/components/dashboard/SummaryCards.tsx`:
- Renderuj 3 x SummaryCard
- Grid layout z Tailwind

### Krok 8: Komponenty Dashboard - część 2 (Wykres)

8.1. Zainstaluj Recharts:
```bash
npm install recharts
```

8.2. Utwórz `src/components/dashboard/DailyChart.tsx`:
- Implementuj BarChart z Recharts
- Customowy tooltip dark theme
- Responsive container
- Loading skeleton

8.3. Przygotuj dane dla wykresu:
- Transform `dailyBreakdown` z API do formatu wykresu
- Format daty DD dla osi X

### Krok 9: Komponenty Dashboard - część 3 (Lista transakcji)

9.1. Utwórz `src/components/dashboard/TransactionItem.tsx`:
- Renderuj pojedynczą transakcję
- Hover effects dla akcji
- Tooltip dla notatki
- Formatowanie kwoty i daty

9.2. Utwórz `src/components/dashboard/TransactionsList.tsx`:
- Implementuj infinite scroll z IntersectionObserver
- Użyj hooka `useTransactions`
- EmptyState gdy brak danych
- Inline spinner dla kolejnych stron

9.3. Utwórz `src/components/dashboard/FloatingActionButton.tsx`:
- Fixed positioning bottom-right
- Ikona "+" (Lucide React)
- Global keyboard shortcut Ctrl+K

### Krok 10: Komponenty Dashboard - część 4 (Modals)

10.1. Utwórz `src/components/dashboard/TransactionModal.tsx`:
- Implementuj Dialog z Shadcn
- Formularz z React Hook Form
- Walidacja Zod schema
- Type toggle (Tabs Shadcn)
- Amount input z auto-formatowaniem
- Date picker (Popover + Calendar Shadcn)
- Category select (Select Shadcn)
- Note textarea z licznikiem znaków
- Unsaved changes alert
- Loading states

10.2. Utwórz `src/components/dashboard/DeleteDialog.tsx`:
- Implementuj AlertDialog z Shadcn
- Podsumowanie transakcji do usunięcia
- Loading state na przycisku

### Krok 11: Główny komponent Dashboard

11.1. Utwórz `src/components/dashboard/DashboardContent.tsx`:
- Importuj wszystkie subkomponenty
- Zarządzaj stanem modali
- Użyj hooków: `useDatePeriod`, `useDashboard`, `useTransactionMutations`
- Implementuj callbacks: `onEditTransaction`, `onDeleteTransaction`, `onAddTransaction`
- Error boundary wrapper

### Krok 12: Strona Astro

12.1. Utwórz `src/pages/dashboard.astro`:
- Użyj layoutu `AppLayout.astro`
- Server-side check autentykacji
- Przekaż initial month/year z URL params
- Renderuj `<DashboardContent client:load />`

12.2. Utwórz lub zaktualizuj `src/layouts/AppLayout.astro`:
- Header z nawigacją
- Slot dla zawartości
- React Query Provider
- Toaster component

### Krok 13: Styling i Tailwind

13.1. Upewnij się, że zainstalowane są komponenty Shadcn:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add badge
```

13.2. Dodaj custom CSS dla dark theme w `src/styles/global.css`:
- CSS variables dla kolorów
- Custom scrollbar styling
- Focus states

### Krok 14: Utility functions

14.1. Utwórz `src/lib/utils/formatCurrency.ts`:
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}
```

14.2. Utwórz `src/lib/utils/formatDate.ts`:
```typescript
export function formatDate(date: string, format: 'DD.MM' | 'DD.MM.YYYY'): string {
  // Implementacja formatowania dat
}
```

14.3. Utwórz `src/lib/utils/getMonthName.ts`:
```typescript
export function getMonthName(month: number): string {
  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];
  return months[month - 1];
}
```

### Krok 15: Accessibility

15.1. Dodaj ARIA labels:
- FAB: `aria-label="Dodaj transakcję"`
- Edit button: `aria-label="Edytuj transakcję"`
- Delete button: `aria-label="Usuń transakcję"`

15.2. Dodaj keyboard navigation:
- Tab order dla wszystkich interaktywnych elementów
- Escape zamyka modale
- Enter/Space dla przycisków
- Arrow keys dla nawigacji w select

15.3. Dodaj focus states:
- Visible focus ring (Tailwind `focus:ring-2`)

### Krok 16: Testing

16.1. Utwórz testy jednostkowe dla utils:
- `formatCurrency.test.ts`
- `formatDate.test.ts`
- `getMonthName.test.ts`

16.2. Utwórz testy komponentów:
- `TransactionModal.test.tsx`
- `TransactionsList.test.tsx`
- `SummaryCards.test.tsx`

16.3. Utwórz testy integracyjne dla hooków:
- `useDashboard.test.ts`
- `useTransactions.test.ts`

### Krok 17: Optymalizacje

17.1. Code splitting:
- Lazy load TransactionModal
- Lazy load DeleteDialog
- Lazy load DailyChart

17.2. Memoization:
- Memoize TransactionItem component
- Memoize expensive calculations

17.3. Prefetching:
- Prefetch next month data on hover (100ms delay)
- Prefetch categories on FAB hover

### Krok 18: Final polish

18.1. Sprawdź responsywność (desktop only, min-width: 1024px)

18.2. Przetestuj dark mode styling

18.3. Sprawdź wszystkie toast notifications

18.4. Przetestuj wszystkie error states

18.5. Sprawdź loading states

18.6. Code review i cleanup

### Krok 19: Dokumentacja

19.1. Dodaj JSDoc comments do wszystkich funkcji

19.2. Utwórz README dla komponentów dashboard

19.3. Dokumentuj custom hooks

### Krok 20: Deployment checklist

20.1. Sprawdź environment variables

20.2. Build production: `npm run build`

20.3. Sprawdź bundle size

20.4. Przetestuj na production build lokalnie

20.5. Deploy na DigitalOcean

---

## Podsumowanie

Ten plan implementacji zapewnia kompleksowy przewodnik krok po kroku do implementacji widoku Dashboard w aplikacji Settlements. Kluczowe punkty:

- **Architektura**: Hybrid Astro + React z React Query dla server state
- **Routing**: URL params jako source of truth dla month/year
- **State Management**: React Query + custom hooks + local useState
- **Walidacja**: Zod schemas dla formularzy
- **Performance**: Code splitting, memoization, infinite scroll
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Error Handling**: Comprehensive error boundaries i user-friendly messages

Plan jest zgodny z PRD, user stories, API specification i tech stack projektu.

