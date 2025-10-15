# Plan implementacji zarządzania transakcjami

## 1. Przegląd

Moduł zarządzania transakcjami odpowiada za wszystkie operacje CRUD (Create, Read, Update, Delete) na transakcjach użytkownika. Składa się z komponentów modalnych umożliwiających:

- **Dodawanie nowej transakcji** - poprzez modal z formularzem
- **Edycję istniejącej transakcji** - w tym samym modalu z pre-filled danymi
- **Usuwanie transakcji** - z dialogiem potwierdzenia
- **Walidację danych** - w czasie rzeczywistym (client-side) i server-side
- **Obsługę błędów** - user-friendly komunikaty

**Kluczowe funkcjonalności:**
- Formularz z 5 polami: typ, kwota, data, kategoria, notatka
- Walidacja Zod (dodatnia kwota, max 2 miejsca po przecinku, prawidłowa data, wymagana kategoria)
- Auto-formatowanie kwoty do PLN
- Date picker z ograniczeniem do wybranego miesiąca
- Searchable dropdown kategorii
- Character counter dla notatki (max 500 znaków)
- Loading states podczas zapisywania
- Optimistic updates (React Query)
- Toast notifications
- Keyboard shortcuts (Ctrl+K, Ctrl+Enter, Escape)

Moduł jest używany w kontekście Dashboard View, ale jest zaprojektowany jako niezależny, reużywalny feature.

## 2. Komponenty modułu

### 2.1. Struktura plików

```
src/components/transactions/
├── TransactionModal.tsx          # Główny modal dodawania/edycji
├── TransactionForm.tsx           # Formularz transakcji
├── DeleteTransactionDialog.tsx   # Dialog potwierdzenia usunięcia
├── AmountInput.tsx              # Custom input dla kwoty PLN
├── CategorySelect.tsx           # Searchable select kategorii
├── DatePickerField.tsx          # Date picker z ograniczeniami
├── NoteTextarea.tsx             # Textarea z licznikiem znaków
└── TypeToggle.tsx               # Toggle Przychód/Wydatek

src/lib/hooks/
├── useTransactionMutations.ts   # Mutations (create, update, delete)
├── useCategories.ts             # Query dla listy kategorii
└── useTransactionForm.ts        # Custom hook dla logiki formularza

src/lib/schemas/
└── transaction.schema.ts        # Zod validation schema

src/lib/utils/
├── formatCurrency.ts            # Format kwoty do PLN
├── parseCurrency.ts             # Parse PLN string do number
└── formatDate.ts                # Format daty DD.MM.YYYY
```

### 2.2. Hierarchia komponentów

```
<TransactionModal>
  └─ <Dialog> (Shadcn)
     ├─ <DialogHeader>
     │  └─ Title: "Dodaj transakcję" / "Edytuj transakcję"
     │
     ├─ <DialogContent>
     │  └─ <TransactionForm>
     │     ├─ <TypeToggle>
     │     │  └─ <Tabs> (Shadcn)
     │     │     ├─ TabsTrigger: "Wydatek"
     │     │     └─ TabsTrigger: "Przychód"
     │     │
     │     ├─ <AmountInput>
     │     │  └─ <Input> z formatowaniem PLN
     │     │
     │     ├─ <DatePickerField>
     │     │  └─ <Popover>
     │     │     └─ <Calendar> (Shadcn)
     │     │
     │     ├─ <CategorySelect>
     │     │  └─ <Select> (Shadcn, searchable)
     │     │
     │     └─ <NoteTextarea>
     │        ├─ <Textarea>
     │        └─ Character counter
     │
     └─ <DialogFooter>
        ├─ <Button variant="ghost">Anuluj</Button>
        └─ <Button type="submit">Zapisz</Button>

<DeleteTransactionDialog>
  └─ <AlertDialog> (Shadcn)
     ├─ <AlertDialogHeader>
     │  └─ Title: "Usuń transakcję?"
     │
     ├─ <AlertDialogContent>
     │  └─ Transaction summary display
     │
     └─ <AlertDialogFooter>
        ├─ <Button variant="ghost">Anuluj</Button>
        └─ <Button variant="destructive">Usuń</Button>
```

## 3. Szczegóły komponentów

### 3.1. TransactionModal.tsx

**Opis:**
Główny komponent modal dla dodawania i edycji transakcji. Obsługuje dwa tryby: `create` i `edit`.

**Główne elementy:**
- `<Dialog>` (Shadcn) - kontener modalu
- `<DialogHeader>` - nagłówek z dynamicznym tytułem
- `<DialogContent>` - zawartość z `<TransactionForm>`
- `<DialogFooter>` - przyciski akcji
- Unsaved changes guard - alert przy próbie zamknięcia dirty form

**Obsługiwane interakcje:**
- Otwieranie modalu → focus na pierwszy input
- Submit formularza → walidacja → API call → zamknięcie
- Anulowanie → sprawdzenie dirty state → opcjonalnie alert → zamknięcie
- Escape key → zamknięcie (z unsaved changes check)
- Backdrop click → zamknięcie (z unsaved changes check)
- Keyboard shortcuts:
  - Ctrl+Enter → submit
  - Escape → anuluj

**Obsługiwana walidacja:**
- Delegowana do `<TransactionForm>`
- Unsaved changes detection (React Hook Form `formState.isDirty`)

**Typy:**
```typescript
type TransactionModalMode = 'create' | 'edit';

interface TransactionModalProps {
  mode: TransactionModalMode;
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDto; // Required dla mode="edit"
  defaultDate?: string; // Opcjonalnie dla mode="create" (YYYY-MM-DD)
  defaultType?: 'income' | 'expense'; // Domyślnie "expense"
}
```

**State:**
```typescript
const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
```

**Logic:**
```typescript
const handleClose = () => {
  if (form.formState.isDirty) {
    setShowUnsavedWarning(true);
  } else {
    onClose();
  }
};

const handleDiscardChanges = () => {
  form.reset();
  setShowUnsavedWarning(false);
  onClose();
};
```

### 3.2. TransactionForm.tsx

**Opis:**
Formularz transakcji z pełną walidacją. Używa React Hook Form + Zod.

**Główne elementy:**
- `<Form>` wrapper (React Hook Form)
- 5 pól formularza (wszystkie jako `<FormField>`):
  1. Type (TypeToggle)
  2. Amount (AmountInput)
  3. Date (DatePickerField)
  4. CategoryId (CategorySelect)
  5. Note (NoteTextarea - opcjonalne)

**Obsługiwane interakcje:**
- Real-time walidacja przy każdej zmianie
- Submit handler (onSubmit)
- Auto-focus na Amount przy mount
- Tab order: Type → Amount → Date → Category → Note → Submit

**Obsługiwana walidacja (szczegółowa):**
```typescript
// Zod schema
{
  type: z.enum(['income', 'expense']),
  
  amount: z
    .number()
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
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty')
    .refine((date) => !isNaN(Date.parse(date)), 'Nieprawidłowa data'),
  
  categoryId: z
    .string({ required_error: 'Kategoria jest wymagana' })
    .uuid('Nieprawidłowa kategoria'),
  
  note: z
    .string()
    .max(500, 'Notatka może mieć maksymalnie 500 znaków')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val)
}
```

**Typy:**
```typescript
interface TransactionFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

type TransactionFormData = {
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  note?: string | null;
};
```

**Default Values Logic:**
```typescript
// Create mode
const defaultValues = {
  type: props.defaultType || 'expense',
  amount: undefined,
  date: props.defaultDate || format(new Date(), 'yyyy-MM-dd'),
  categoryId: undefined,
  note: null,
};

// Edit mode
const defaultValues = {
  type: transaction.type,
  amount: transaction.amount,
  date: transaction.date,
  categoryId: transaction.category.id,
  note: transaction.note || null,
};
```

### 3.3. TypeToggle.tsx

**Opis:**
Toggle wyboru typu transakcji (Przychód/Wydatek) jako tabs.

**Główne elementy:**
- `<Tabs>` (Shadcn)
- `<TabsList>` z dwoma triggerami
- Kontrolowany przez React Hook Form

**Obsługiwane interakcje:**
- Click na tab → zmiana typu
- Keyboard: Arrow left/right → przełączanie

**Styling:**
- Wydatek: domyślny kolor (neutral)
- Przychód: zielony akcent (`data-[state=active]:bg-green-500/10`)

**Typy:**
```typescript
interface TypeToggleProps {
  value: 'income' | 'expense';
  onChange: (value: 'income' | 'expense') => void;
  disabled?: boolean;
}
```

### 3.4. AmountInput.tsx

**Opis:**
Custom input dla kwoty z auto-formatowaniem do PLN i walidacją.

**Główne elementy:**
- `<Input>` bazowy
- Prefix/suffix: "zł" symbol
- Auto-formatting podczas wpisywania
- Parse input value → number dla formularza

**Obsługiwane interakcje:**
- User wpisuje: "150" → display: "150,00 zł"
- User wpisuje: "1234.5" → display: "1 234,50 zł"
- User wpisuje: "1234.567" → validation error: "Max 2 decimals"
- Backspace/delete działają normalnie na formatted value
- Paste → parse → format

**Format Logic:**
```typescript
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || isNaN(value)) return '';
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseCurrency = (formatted: string): number | undefined => {
  // Remove spaces and replace comma with dot
  const cleaned = formatted.replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? undefined : parsed;
};
```

**Typy:**
```typescript
interface AmountInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  disabled?: boolean;
}
```

**State:**
```typescript
const [displayValue, setDisplayValue] = useState('');

useEffect(() => {
  setDisplayValue(formatCurrency(value));
}, [value]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const input = e.target.value;
  const parsed = parseCurrency(input);
  onChange(parsed);
};
```

### 3.5. DatePickerField.tsx

**Opis:**
Date picker z kalendarzem (Shadcn) i ograniczeniami dat.

**Główne elementy:**
- `<Popover>` (Shadcn)
- `<Button>` trigger z ikoną kalendarza
- `<Calendar>` (Shadcn) w popover content
- Display format: DD.MM.YYYY
- Internal format: YYYY-MM-DD

**Obsługiwane interakcje:**
- Click button → otwiera kalendarz
- Select date → zamyka popover, ustawia wartość
- Keyboard: Arrow keys nawigacja w kalendarzu, Enter wybiera, Escape zamyka

**Ograniczenia dat:**
- Brak sztywnych ograniczeń w MVP (użytkownik może wybrać dowolną datę)
- Przyszłość: opcjonalne `minDate`, `maxDate` props

**Typy:**
```typescript
interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  minDate?: Date; // Opcjonalne ograniczenie
  maxDate?: Date; // Opcjonalne ograniczenie
}
```

**Display Logic:**
```typescript
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return 'Wybierz datę';
  
  const date = new Date(dateString);
  return format(date, 'dd.MM.yyyy', { locale: pl });
};
```

### 3.6. CategorySelect.tsx

**Opis:**
Searchable dropdown select kategorii. Ładuje kategorie z API.

**Główne elementy:**
- `<Select>` (Shadcn)
- Lista kategorii z `useCategories` hook
- Loading state podczas fetch
- Empty state gdy brak kategorii

**Obsługiwane interakcje:**
- Click → otwiera dropdown
- Type to search → filtrowanie kategorii (client-side)
- Select → zamyka dropdown, ustawia wartość
- Keyboard: Arrow up/down, Enter, Escape

**Sortowanie kategorii:**
- Alfabetycznie rosnąco
- "Inne" zawsze na końcu

**Typy:**
```typescript
interface CategorySelectProps {
  value: string | undefined; // category ID
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}
```

**Logic:**
```typescript
const { data: categories, isLoading } = useCategories();

const sortedCategories = useMemo(() => {
  if (!categories) return [];
  
  const others = categories.filter(c => c.name === 'Inne');
  const rest = categories
    .filter(c => c.name !== 'Inne')
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  
  return [...rest, ...others];
}, [categories]);
```

**Empty State:**
```typescript
if (categories?.length === 0) {
  return (
    <Alert>
      <AlertDescription>
        Nie masz jeszcze żadnych kategorii. 
        <Link to="/settings">Utwórz pierwszą kategorię</Link>
      </AlertDescription>
    </Alert>
  );
}
```

### 3.7. NoteTextarea.tsx

**Opis:**
Textarea dla notatki z licznikiem znaków i walidacją max length.

**Główne elementy:**
- `<Textarea>` (Shadcn)
- Character counter display: `{current}/{max}`
- Visual warning gdy blisko limitu (>450 znaków)

**Obsługiwane interakcje:**
- Standard textarea interactions
- Real-time character count update
- Warning color gdy > 450/500

**Typy:**
```typescript
interface NoteTextareaProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
  maxLength?: number; // Default 500
}
```

**Counter Logic:**
```typescript
const currentLength = value?.length || 0;
const maxLength = props.maxLength || 500;
const isNearLimit = currentLength > maxLength * 0.9; // >450 chars

<div className="flex justify-between items-center mt-1">
  <FormMessage />
  <span className={cn(
    "text-sm",
    isNearLimit ? "text-yellow-500" : "text-muted-foreground"
  )}>
    {currentLength}/{maxLength}
  </span>
</div>
```

### 3.8. DeleteTransactionDialog.tsx

**Opis:**
Alert dialog potwierdzenia usunięcia transakcji.

**Główne elementy:**
- `<AlertDialog>` (Shadcn)
- Transaction summary (kwota, kategoria, data)
- Warning message
- Destructive action button

**Obsługiwane interakcje:**
- Click "Usuń" → wywołanie onConfirm → zamknięcie
- Click "Anuluj" / Escape → zamknięcie bez akcji
- Loading state podczas usuwania

**Typy:**
```typescript
interface DeleteTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDto;
  onConfirm: () => Promise<void>;
}
```

**Transaction Summary Display:**
```typescript
<AlertDialogDescription asChild>
  <div className="space-y-2">
    <p>Czy na pewno chcesz usunąć tę transakcję?</p>
    <div className="bg-muted p-3 rounded-md">
      <div className="flex justify-between items-center">
        <span className="font-medium">
          {formatCurrency(transaction.amount)}
        </span>
        <Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>
          {transaction.type === 'income' ? 'Przychód' : 'Wydatek'}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {transaction.category.name} • {formatDate(transaction.date)}
      </div>
      {transaction.note && (
        <p className="text-sm mt-2 italic">"{transaction.note}"</p>
      )}
    </div>
    <p className="text-sm text-muted-foreground">
      Ta operacja jest nieodwracalna.
    </p>
  </div>
</AlertDialogDescription>
```

## 4. Custom Hooks

### 4.1. useTransactionMutations.ts

**Opis:**
React Query mutations dla operacji CRUD na transakcjach.

**Exports:**
```typescript
export function useTransactionMutations() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionCommand) => 
      createTransaction(data),
    onMutate: async (newTransaction) => {
      // Optimistic update logic
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      // Show error toast
    },
    onSuccess: () => {
      // Invalidate queries
      // Show success toast
    },
    onSettled: () => {
      // Final cleanup
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionCommand }) =>
      updateTransaction(id, data),
    // Similar handlers...
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    // Similar handlers...
  });
  
  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
```

**Optimistic Updates:**
```typescript
onMutate: async (newTransaction) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['transactions'] });
  
  // Snapshot previous value
  const previousTransactions = queryClient.getQueryData(['transactions']);
  
  // Optimistically update cache
  queryClient.setQueryData(['transactions'], (old: any) => {
    if (!old) return old;
    
    return {
      ...old,
      pages: [
        {
          ...old.pages[0],
          transactions: [
            { ...newTransaction, id: 'temp-id', createdAt: new Date().toISOString() },
            ...old.pages[0].transactions,
          ],
        },
        ...old.pages.slice(1),
      ],
    };
  });
  
  // Return context with snapshot
  return { previousTransactions };
},

onError: (err, variables, context) => {
  // Rollback to previous value
  if (context?.previousTransactions) {
    queryClient.setQueryData(['transactions'], context.previousTransactions);
  }
  
  toast.error('Nie udało się zapisać transakcji');
},

onSuccess: () => {
  toast.success('Transakcja zapisana pomyślnie');
},

onSettled: () => {
  // Always refetch to ensure consistency
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
},
```

### 4.2. useTransactionForm.ts

**Opis:**
Custom hook enkapsulujący logikę formularza transakcji.

**Usage:**
```typescript
export function useTransactionForm(
  mode: 'create' | 'edit',
  transaction?: TransactionDto,
  defaultDate?: string
) {
  const { createMutation, updateMutation } = useTransactionMutations();
  
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: mode === 'create' 
      ? {
          type: 'expense',
          amount: undefined,
          date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
          categoryId: undefined,
          note: null,
        }
      : {
          type: transaction!.type,
          amount: transaction!.amount,
          date: transaction!.date,
          categoryId: transaction!.category.id,
          note: transaction!.note,
        },
  });
  
  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          amount: data.amount,
          date: data.date,
          categoryId: data.categoryId,
          type: data.type,
          note: data.note || null,
        });
      } else {
        await updateMutation.mutateAsync({
          id: transaction!.id,
          data: {
            amount: data.amount,
            date: data.date,
            categoryId: data.categoryId,
            type: data.type,
            note: data.note || null,
          },
        });
      }
      
      return true; // Success
    } catch (error) {
      console.error('Transaction form submit error:', error);
      return false; // Failure
    }
  };
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  
  return {
    form,
    onSubmit,
    isSubmitting,
  };
}
```

### 4.3. useCategories.ts

**Opis:**
React Query hook dla pobierania listy kategorii.

```typescript
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60 * 1000, // 5 minut - kategorie rzadko się zmieniają
    refetchOnWindowFocus: false,
  });
}

// Service function
async function fetchCategories(): Promise<CategoryDto[]> {
  const response = await fetch('/api/categories', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return response.json();
}
```

## 5. Validation Schema (Zod)

### 5.1. transactionFormSchema

**Lokalizacja:** `src/lib/schemas/transaction.schema.ts`

```typescript
import { z } from 'zod';

export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Typ transakcji jest wymagany',
    invalid_type_error: 'Typ musi być przychodem lub wydatkiem',
  }),
  
  amount: z
    .number({
      required_error: 'Kwota jest wymagana',
      invalid_type_error: 'Kwota musi być liczbą',
    })
    .positive('Kwota musi być większa od 0')
    .max(999999999.99, 'Kwota jest zbyt duża (max: 999 999 999,99 zł)')
    .refine(
      (val) => {
        // Check max 2 decimal places
        const decimals = val.toString().split('.')[1];
        return !decimals || decimals.length <= 2;
      },
      'Kwota może mieć maksymalnie 2 miejsca po przecinku'
    ),
  
  date: z
    .string({ required_error: 'Data jest wymagana' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty (wymagany: YYYY-MM-DD)')
    .refine(
      (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      'Nieprawidłowa data'
    )
    .refine(
      (dateString) => {
        // Date nie może być w przyszłości
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      'Data nie może być w przyszłości'
    ),
  
  categoryId: z
    .string({ required_error: 'Kategoria jest wymagana' })
    .uuid('Nieprawidłowy identyfikator kategorii'),
  
  note: z
    .string()
    .max(500, 'Notatka może mieć maksymalnie 500 znaków')
    .nullable()
    .optional()
    .transform(val => {
      // Convert empty string to null
      if (val === '' || val === undefined) return null;
      return val;
    }),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;
```

### 5.2. Error Messages Mapping

```typescript
// src/lib/constants/errorMessages.ts

export const TRANSACTION_ERROR_MESSAGES = {
  REQUIRED_TYPE: 'Typ transakcji jest wymagany',
  REQUIRED_AMOUNT: 'Kwota jest wymagana',
  INVALID_AMOUNT: 'Kwota musi być liczbą dodatnią',
  AMOUNT_TOO_LARGE: 'Kwota jest zbyt duża',
  AMOUNT_DECIMALS: 'Kwota może mieć maksymalnie 2 miejsca po przecinku',
  REQUIRED_DATE: 'Data jest wymagana',
  INVALID_DATE_FORMAT: 'Nieprawidłowy format daty',
  INVALID_DATE: 'Nieprawidłowa data',
  DATE_IN_FUTURE: 'Data nie może być w przyszłości',
  REQUIRED_CATEGORY: 'Kategoria jest wymagana',
  INVALID_CATEGORY: 'Wybrana kategoria nie istnieje',
  NOTE_TOO_LONG: 'Notatka może mieć maksymalnie 500 znaków',
  
  // API Errors
  CATEGORY_NOT_FOUND: 'Wybrana kategoria nie została znaleziona',
  UNAUTHORIZED: 'Nie masz uprawnień do wykonania tej operacji',
  TRANSACTION_NOT_FOUND: 'Transakcja nie została znaleziona',
  NETWORK_ERROR: 'Sprawdź połączenie internetowe',
  UNKNOWN_ERROR: 'Wystąpił nieoczekiwany błąd',
} as const;
```

## 6. API Integration

### 6.1. Create Transaction

**Endpoint:** `POST /api/transactions`

**Service Function:**
```typescript
// src/lib/services/transactions.service.ts

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
    
    if (response.status === 422) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }
    
    if (response.status === 400) {
      throw new Error(error.message || TRANSACTION_ERROR_MESSAGES.UNKNOWN_ERROR);
    }
    
    throw new Error(TRANSACTION_ERROR_MESSAGES.UNKNOWN_ERROR);
  }
  
  return response.json();
}
```

**Request Type:** `CreateTransactionCommand`
```typescript
{
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  type: 'income' | 'expense';
  note?: string | null;
}
```

**Response Type:** `TransactionDto`
```typescript
{
  id: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  note: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
}
```

**Error Responses:**
- 400 Bad Request - błędy walidacji
- 401 Unauthorized - brak autentykacji
- 422 Unprocessable Entity - kategoria nie istnieje
- 500 Internal Server Error

### 6.2. Update Transaction

**Endpoint:** `PATCH /api/transactions/{id}`

**Service Function:**
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
      throw new Error(TRANSACTION_ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }
    
    if (response.status === 403) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    if (response.status === 422) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }
    
    throw new Error(error.message || TRANSACTION_ERROR_MESSAGES.UNKNOWN_ERROR);
  }
  
  return response.json();
}
```

**Request Type:** `UpdateTransactionCommand` (wszystkie pola opcjonalne)
```typescript
{
  amount?: number;
  date?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  note?: string | null;
}
```

### 6.3. Delete Transaction

**Endpoint:** `DELETE /api/transactions/{id}`

**Service Function:**
```typescript
export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }
    
    if (response.status === 403) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    const error = await response.json();
    throw new Error(error.message || TRANSACTION_ERROR_MESSAGES.UNKNOWN_ERROR);
  }
  
  // 204 No Content - success
}
```

## 7. User Flows

### 7.1. Dodawanie nowej transakcji

**Happy Path:**
1. Użytkownik na Dashboard klika FAB "+" lub Ctrl+K
2. Otwiera się `TransactionModal` w trybie `create`
3. Focus automatycznie na polu Amount
4. Użytkownik:
   - Wybiera typ: Wydatek (domyślny) lub Przychód
   - Wpisuje kwotę: "150.50" → auto-format: "150,50 zł"
   - Wybiera datę z kalendarza (domyślnie: dzisiaj)
   - Wybiera kategorię z dropdown (np. "Jedzenie")
   - Opcjonalnie dodaje notatkę: "Zakupy tygodniowe"
5. Real-time walidacja: wszystkie pola poprawne ✓
6. Klika "Zapisz" (lub Ctrl+Enter)
7. Loading state: przycisk disabled + spinner
8. Optimistic update: transakcja pojawia się na liście
9. API call: POST /api/transactions
10. Response success:
    - Modal zamyka się
    - Toast: "Transakcja dodana pomyślnie"
    - Dashboard odświeża dane (invalidate queries)
    - Nowa transakcja widoczna na liście i w wykresie

**Error Paths:**

**A. Błędy walidacji:**
1. Użytkownik próbuje zapisać bez wypełnienia kwoty
2. Walidacja Zod: "Kwota jest wymagana"
3. Błąd wyświetlany pod polem Amount (czerwony tekst)
4. Przycisk "Zapisz" disabled
5. Użytkownik wypełnia kwotę → walidacja OK → przycisk enabled

**B. Kategoria nie istnieje (422):**
1. Użytkownik wybiera kategorię
2. W międzyczasie kategoria zostaje usunięta (inna karta)
3. Submit formularza
4. API zwraca 422
5. Toast error: "Wybrana kategoria nie została znaleziona"
6. Modal pozostaje otwarty
7. CategorySelect odświeża dane
8. Użytkownik wybiera inną kategorię

**C. Network error:**
1. Użytkownik offline podczas submitu
2. Fetch fail
3. Rollback optimistic update
4. Toast error: "Sprawdź połączenie internetowe"
5. Modal pozostaje otwarty z danymi
6. Użytkownik może spróbować ponownie

**D. Unsaved changes:**
1. Użytkownik wypełnia formularz
2. Klika backdrop lub Escape (próba zamknięcia)
3. Alert dialog: "Masz niezapisane zmiany. Zamknąć?"
4. Opcje:
   - "Anuluj" → pozostaje w modalu
   - "Odrzuć zmiany" → modal zamyka się, dane tracone

### 7.2. Edycja transakcji

**Happy Path:**
1. Użytkownik hover na TransactionItem w liście
2. Pokazują się przyciski akcji
3. Klika ikonę edycji (lub Focus + Enter)
4. Otwiera się `TransactionModal` w trybie `edit`
5. Formularz pre-filled danymi transakcji:
   - Typ: "Wydatek"
   - Kwota: "150,50 zł"
   - Data: "12.10.2025"
   - Kategoria: "Jedzenie"
   - Notatka: "Zakupy tygodniowe"
6. Użytkownik modyfikuje kwotę: "150.50" → "175.00"
7. Klika "Zapisz"
8. Loading state
9. API call: PATCH /api/transactions/{id}
10. Response success:
    - Modal zamyka się
    - Toast: "Transakcja zaktualizowana pomyślnie"
    - TransactionItem w liście aktualizuje się
    - Dashboard summary odświeża dane

**Special Case - Transaction deleted elsewhere:**
1. Użytkownik otwiera modal edycji
2. W międzyczasie transakcja zostaje usunięta (inna karta/użytkownik)
3. Submit formularza
4. API zwraca 404
5. Toast error: "Ta transakcja została usunięta"
6. Modal zamyka się
7. TransactionsList odświeża dane (transakcja znika)

### 7.3. Usuwanie transakcji

**Happy Path:**
1. Użytkownik hover na TransactionItem
2. Klika ikonę usunięcia (lub Focus + Delete key)
3. Otwiera się `DeleteTransactionDialog`
4. Dialog pokazuje podsumowanie:
   ```
   Czy na pewno chcesz usunąć tę transakcję?
   
   ┌─────────────────────────────────┐
   │ 150,50 zł            [Wydatek]  │
   │ Jedzenie • 12.10.2025           │
   │ "Zakupy tygodniowe"             │
   └─────────────────────────────────┘
   
   Ta operacja jest nieodwracalna.
   ```
5. Użytkownik klika "Usuń"
6. Loading state na przycisku
7. API call: DELETE /api/transactions/{id}
8. Response success (204):
   - Dialog zamyka się
   - Toast: "Transakcja usunięta pomyślnie"
   - TransactionItem fade out z listy
   - Dashboard summary odświeża dane

**Error Path:**
1. Kroki 1-7 jak wyżej
2. API zwraca 403 (brak uprawnień - edge case)
3. Toast error: "Nie masz uprawnień do usunięcia tej transakcji"
4. Dialog pozostaje otwarty
5. Użytkownik klika "Anuluj"

## 8. Warunki i walidacja

### 8.1. Walidacja client-side (Zod)

**Pole Amount:**
- ✓ Required
- ✓ Musi być liczbą (number type)
- ✓ Musi być > 0
- ✓ Max 999,999,999.99
- ✓ Max 2 miejsca po przecinku

**Pole Date:**
- ✓ Required
- ✓ Format YYYY-MM-DD
- ✓ Prawidłowa data kalendarzowa
- ✓ Nie w przyszłości (max: dzisiaj)

**Pole CategoryId:**
- ✓ Required
- ✓ UUID format
- ✓ Kategoria istnieje (weryfikowane przez API)

**Pole Type:**
- ✓ Required
- ✓ Enum: 'income' | 'expense'

**Pole Note:**
- ✗ Optional
- ✓ Max 500 znaków
- ✓ Null gdy puste

### 8.2. Warunki wyświetlania

**Przycisk "Zapisz":**
- Disabled gdy: `!form.formState.isValid || isSubmitting`
- Enabled gdy: formularz valid i nie trwa submit

**Character counter (Note):**
- Szary: 0-450 znaków
- Żółty: 451-500 znaków (warning)
- Czerwony: >500 (error state, submit disabled)

**Loading spinner:**
- Pokazany na przycisku "Zapisz" gdy: `isSubmitting === true`

**Error messages:**
- Pokazane pod polami gdy: `form.formState.errors.{field} !== undefined`

**Unsaved changes alert:**
- Pokazany gdy: `form.formState.isDirty && użytkownik próbuje zamknąć modal`

## 9. Obsługa błędów

### 9.1. Błędy walidacji formularza

**Strategia:**
- Real-time walidacja przy onChange (debounced 300ms dla Amount)
- OnBlur validation dla wszystkich pól
- OnSubmit comprehensive validation

**Display:**
- Czerwone obramowanie pola (`border-red-500`)
- Error message pod polem w `<FormMessage>`
- Ikona AlertCircle przy polu (opcjonalne)

**Focus management:**
- Po błędnym submicie: focus na pierwsze pole z błędem
- `form.setFocus(firstErrorField)`

### 9.2. Błędy API

**HTTP Error Codes Mapping:**

| Code | Error | UI Action |
|------|-------|-----------|
| 400 | Validation error | Show field-specific errors from API |
| 401 | Unauthorized | Redirect to login + toast |
| 403 | Forbidden | Toast: "Brak uprawnień" |
| 404 | Not found (transaction) | Toast + close modal + refresh list |
| 422 | Invalid category | Toast + refresh categories dropdown |
| 500 | Server error | Toast: "Błąd serwera" + retry option |

**Toast Messages:**
```typescript
// Success
toast.success('Transakcja dodana pomyślnie');
toast.success('Transakcja zaktualizowana pomyślnie');
toast.success('Transakcja usunięta pomyślnie');

// Errors
toast.error('Nie udało się zapisać transakcji');
toast.error('Wybrana kategoria nie została znaleziona');
toast.error('Ta transakcja została usunięta');
toast.error('Sprawdź połączenie internetowe');
```

### 9.3. Optimistic Update Rollback

**Scenario:**
1. User submits transaction
2. Optimistic update: transaction appears in list immediately
3. API call fails (network error)
4. Rollback: remove optimistic transaction from cache
5. Toast error
6. Modal remains open with data

**Implementation:**
```typescript
onError: (error, variables, context) => {
  // Restore previous cache state
  if (context?.previousTransactions) {
    queryClient.setQueryData(['transactions'], context.previousTransactions);
  }
  
  toast.error('Nie udało się zapisać transakcji');
}
```

### 9.4. Race Conditions

**Scenario: Rapid edits**
1. User opens edit modal for transaction A
2. User submits changes
3. Before response, user closes modal and edits transaction B
4. Response for A arrives after B's modal is already open

**Solution:**
- Each mutation tracked separately
- Modal state tied to specific transaction ID
- Stale modal data ignored (check transaction ID on success)

## 10. Keyboard Shortcuts

### 10.1. Global Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Otwórz modal dodawania transakcji |

**Implementation:**
```typescript
// W Dashboard component lub Layout
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setTransactionModalOpen(true);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 10.2. Modal Shortcuts

| Shortcut | Action |
|----------|--------|
| Escape | Zamknij modal (z unsaved changes check) |
| Ctrl+Enter | Submit formularza |

**Implementation:**
```typescript
// W TransactionModal
<Dialog open={isOpen} onOpenChange={handleClose}>
  <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={(e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  }}>
    {/* Form fields */}
  </form>
</Dialog>
```

### 10.3. Form Navigation

| Shortcut | Action |
|----------|--------|
| Tab | Następne pole |
| Shift+Tab | Poprzednie pole |
| Arrow Left/Right | Przełączanie typu (w TypeToggle) |
| Space | Toggle dropdown/calendar |
| Enter | Submit (gdy focus na przycisku) |

## 11. Accessibility (a11y)

### 11.1. ARIA Labels

```tsx
<Input
  aria-label="Kwota transakcji"
  aria-required="true"
  aria-invalid={!!errors.amount}
  aria-describedby={errors.amount ? "amount-error" : undefined}
/>

{errors.amount && (
  <FormMessage id="amount-error" role="alert">
    {errors.amount.message}
  </FormMessage>
)}
```

### 11.2. Focus Management

**Modal open:**
- Auto-focus na pierwszy input (Amount)
- Focus trap w modalu (Shadcn Dialog handles this)

**Modal close:**
- Return focus do elementu który otworzył modal

**After submit error:**
- Focus na pierwsze pole z błędem

**Delete dialog:**
- Focus na przycisk "Anuluj" (safer default)

### 11.3. Screen Reader Support

- Form labels properly associated
- Error announcements via `role="alert"` on FormMessage
- Loading states announced: `aria-busy="true"` during submit
- Success/error toasts with `aria-live="polite"`

### 11.4. Keyboard Navigation

- All interactive elements accessible via Tab
- Logical tab order: Type → Amount → Date → Category → Note → Actions
- Escape closes modals
- Enter submits forms (when appropriate)

## 12. Kroki implementacji

### Krok 1: Setup Dependencies

1.1. Instalacja potrzebnych bibliotek:
```bash
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-query
npm install date-fns
npm install sonner
```

1.2. Instalacja Shadcn UI components:
```bash
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add label
```

### Krok 2: Struktura plików

2.1. Utwórz katalogi:
```
mkdir -p src/components/transactions
mkdir -p src/lib/hooks
mkdir -p src/lib/schemas
mkdir -p src/lib/utils
mkdir -p src/lib/constants
```

### Krok 3: Validation Schema

3.1. Utwórz `src/lib/schemas/transaction.schema.ts`:
- Implementuj `transactionFormSchema` z Zod
- Export type `TransactionFormData`
- Dodaj wszystkie walidacje (amount, date, category, note)

3.2. Utwórz `src/lib/constants/errorMessages.ts`:
- Zdefiniuj `TRANSACTION_ERROR_MESSAGES` object
- User-friendly messages dla wszystkich błędów

### Krok 4: Utility Functions

4.1. Utwórz `src/lib/utils/formatCurrency.ts`:
```typescript
export function formatCurrency(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '';
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

4.2. Utwórz `src/lib/utils/parseCurrency.ts`:
```typescript
export function parseCurrency(formatted: string): number | undefined {
  const cleaned = formatted.replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
}
```

4.3. Utwórz `src/lib/utils/formatDate.ts`:
```typescript
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export function formatDate(dateString: string, pattern = 'dd.MM.yyyy'): string {
  const date = new Date(dateString);
  return format(date, pattern, { locale: pl });
}
```

### Krok 5: Custom Hooks - Mutations

5.1. Utwórz `src/lib/hooks/useTransactionMutations.ts`:
- Implementuj `createMutation` z optimistic updates
- Implementuj `updateMutation`
- Implementuj `deleteMutation`
- Dodaj toast notifications
- Dodaj query invalidation

### Krok 6: Custom Hooks - Categories

6.1. Utwórz `src/lib/hooks/useCategories.ts`:
- React Query hook dla pobierania kategorii
- Stale time: 5 minut

### Krok 7: Custom Hooks - Form

7.1. Utwórz `src/lib/hooks/useTransactionForm.ts`:
- Hook enkapsulujący logikę formularza
- Setup React Hook Form z Zod resolver
- onSubmit handler (create vs edit logic)
- Return form, onSubmit, isSubmitting

### Krok 8: Basic Form Components - TypeToggle

8.1. Utwórz `src/components/transactions/TypeToggle.tsx`:
- Tabs component (Shadcn)
- Dwa triggery: Wydatek, Przychód
- Controlled przez value/onChange props
- Styling z color coding

### Krok 9: Basic Form Components - AmountInput

9.1. Utwórz `src/components/transactions/AmountInput.tsx`:
- Custom input z formatowaniem PLN
- useState dla displayValue
- formatCurrency / parseCurrency logic
- onChange handler z parsing
- "zł" suffix

### Krok 10: Basic Form Components - DatePickerField

10.1. Utwórz `src/components/transactions/DatePickerField.tsx`:
- Popover + Calendar (Shadcn)
- Button trigger z formatowaną datą
- Display format: DD.MM.YYYY
- Internal format: YYYY-MM-DD
- Opcjonalne minDate/maxDate props

### Krok 11: Basic Form Components - CategorySelect

11.1. Utwórz `src/components/transactions/CategorySelect.tsx`:
- Select component (Shadcn)
- Integration z useCategories hook
- Loading state podczas fetch
- Sortowanie: alfabetycznie + "Inne" na końcu
- Empty state gdy brak kategorii

### Krok 12: Basic Form Components - NoteTextarea

12.1. Utwórz `src/components/transactions/NoteTextarea.tsx`:
- Textarea component
- Character counter display
- Warning color gdy >450 chars
- MaxLength: 500

### Krok 13: Transaction Form

13.1. Utwórz `src/components/transactions/TransactionForm.tsx`:
- Setup React Hook Form wrapper
- Integrate wszystkie sub-komponenty:
  - TypeToggle
  - AmountInput
  - DatePickerField
  - CategorySelect
  - NoteTextarea
- FormField dla każdego pola
- Submit handler props
- Loading states

### Krok 14: Transaction Modal

14.1. Utwórz `src/components/transactions/TransactionModal.tsx`:
- Dialog component (Shadcn)
- Integration z useTransactionForm hook
- Mode logic (create vs edit)
- Default values setup
- Unsaved changes guard
- AlertDialog dla unsaved warning
- Focus management
- Keyboard shortcuts (Ctrl+Enter, Escape)

### Krok 15: Delete Dialog

15.1. Utwórz `src/components/transactions/DeleteTransactionDialog.tsx`:
- AlertDialog component
- Transaction summary display (kwota, kategoria, data, notatka)
- Destructive action button
- onConfirm handler integration
- Loading state

### Krok 16: Service Layer

16.1. Sprawdź/uaktualnij `src/lib/services/transactions.service.ts`:
- `createTransaction(data)` function
- `updateTransaction(id, data)` function  
- `deleteTransaction(id)` function
- Error handling z user-friendly messages
- Type safety (TypeScript)

### Krok 17: Integration Tests

17.1. Test TransactionForm validation:
```typescript
// transaction-form.test.tsx
describe('TransactionForm', () => {
  it('validates required fields', async () => {
    // Test amount required
    // Test category required
    // Test date required
  });
  
  it('validates amount constraints', async () => {
    // Test amount > 0
    // Test max 2 decimals
    // Test max value
  });
  
  it('validates date constraints', async () => {
    // Test valid date format
    // Test no future dates
  });
  
  it('validates note max length', async () => {
    // Test 500 char limit
  });
});
```

17.2. Test useTransactionMutations:
```typescript
// useTransactionMutations.test.ts
describe('useTransactionMutations', () => {
  it('creates transaction optimistically', async () => {
    // Mock API
    // Call createMutation
    // Verify optimistic update
    // Verify invalidation
  });
  
  it('rolls back on error', async () => {
    // Mock API error
    // Call createMutation
    // Verify rollback
    // Verify error toast
  });
});
```

### Krok 18: Component Tests

18.1. Test AmountInput formatting:
```typescript
describe('AmountInput', () => {
  it('formats currency correctly', () => {
    // Input: 1234.5
    // Display: "1 234,50"
  });
  
  it('parses currency correctly', () => {
    // User types: "1234,50"
    // Parsed: 1234.5
  });
});
```

18.2. Test CategorySelect:
```typescript
describe('CategorySelect', () => {
  it('sorts categories alphabetically', () => {
    // Verify sort order
    // Verify "Inne" at end
  });
  
  it('shows loading state', () => {
    // Mock loading
    // Verify spinner/skeleton
  });
});
```

### Krok 19: E2E Tests

19.1. Test add transaction flow:
```typescript
// transactions.spec.ts (Playwright)
test('user can add transaction', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Open modal
  await page.click('[aria-label="Dodaj transakcję"]');
  
  // Fill form
  await page.click('text=Przychód');
  await page.fill('[aria-label="Kwota transakcji"]', '1500');
  await page.fill('[aria-label="Data"]', '15.10.2025');
  await page.click('[aria-label="Kategoria"]');
  await page.click('text=Wynagrodzenie');
  await page.fill('[aria-label="Notatka"]', 'Pensja październik');
  
  // Submit
  await page.click('button:has-text("Zapisz")');
  
  // Verify
  await expect(page.locator('text=Transakcja dodana pomyślnie')).toBeVisible();
  await expect(page.locator('text=1 500,00 zł')).toBeVisible();
});
```

19.2. Test edit transaction flow
19.3. Test delete transaction flow

### Krok 20: Accessibility Audit

20.1. Keyboard navigation test:
- Tab przez wszystkie pola
- Enter submits form
- Escape closes modal

20.2. Screen reader test:
- All labels associated
- Errors announced
- Loading states announced

20.3. Focus management test:
- Modal open → focus on first field
- Modal close → focus returns
- Error → focus on error field

### Krok 21: Performance Optimization

21.1. Memoization:
```typescript
const MemoizedTransactionForm = memo(TransactionForm);
const MemoizedAmountInput = memo(AmountInput);
```

21.2. Debounce expensive operations:
```typescript
// W AmountInput - debounce onChange dla lepszej wydajności
const debouncedOnChange = useMemo(
  () => debounce(onChange, 300),
  [onChange]
);
```

21.3. Lazy load modal (opcjonalne):
```typescript
const TransactionModal = lazy(() => import('./TransactionModal'));
```

### Krok 22: Error Boundaries

22.1. Wrap modals w ErrorBoundary:
```tsx
<ErrorBoundary fallback={<ModalErrorFallback />}>
  <TransactionModal {...props} />
</ErrorBoundary>
```

### Krok 23: Documentation

23.1. JSDoc dla wszystkich komponentów:
```typescript
/**
 * Modal for adding and editing transactions.
 * 
 * @param mode - 'create' for new transaction, 'edit' for existing
 * @param transaction - Required when mode is 'edit'
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal should close
 * 
 * @example
 * <TransactionModal
 *   mode="create"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 */
```

23.2. Usage examples w README

### Krok 24: Final Integration

24.1. Integracja z Dashboard:
- Import TransactionModal w DashboardContent
- State management dla modal (open/close)
- Pass transaction data dla edit mode
- Delete dialog integration

24.2. FAB (Floating Action Button) setup:
- Position: fixed bottom-right
- z-index wysoki
- Click → open TransactionModal (mode="create")

### Krok 25: Polish & QA

25.1. Visual polish:
- Sprawdź wszystkie spacing/padding
- Animacje (transitions dla modal open/close)
- Hover states
- Focus states (visible rings)

25.2. Copy refinement:
- Wszystkie labels po polsku
- Wszystkie error messages user-friendly
- Toast messages krótkie i konkretne

25.3. Dark theme consistency:
- Wszystkie kolory z dark theme palette
- Contrast ratio > 4.5:1

25.4. Final testing:
- Test wszystkich happy paths
- Test wszystkich error paths
- Test keyboard shortcuts
- Test na różnych rozdzielczościach (desktop)

---

## Podsumowanie

Ten plan implementacji zapewnia kompletny, krok po kroku przewodnik do stworzenia modułu zarządzania transakcjami w aplikacji Settlements.

**Kluczowe elementy:**
- **8 komponentów** (TransactionModal, TransactionForm, TypeToggle, AmountInput, DatePickerField, CategorySelect, NoteTextarea, DeleteDialog)
- **3 custom hooki** (useTransactionMutations, useCategories, useTransactionForm)
- **Pełna walidacja** (Zod schema z 5 polami)
- **Optimistic updates** (React Query)
- **Auto-formatting** (kwota PLN)
- **Keyboard shortcuts** (Ctrl+K, Ctrl+Enter, Escape)
- **Accessibility** (ARIA labels, focus management, screen reader support)
- **Error handling** (user-friendly messages, rollback, retries)

Po implementacji użytkownicy będą mogli:
✅ Dodawać nowe transakcje z pełną walidacją
✅ Edytować istniejące transakcje
✅ Usuwać transakcje z potwierdzeniem
✅ Korzystać z wygodnego formularza z auto-formatowaniem
✅ Otrzymywać natychmiastowy feedback (optimistic updates, toasts)
✅ Pracować efektywnie z keyboard shortcuts

Moduł jest zaprojektowany jako reużywalny, dobrze przetestowany i accessible dla wszystkich użytkowników.

