# Plan implementacji widoku Settings (Ustawienia)

## 1. Przegląd

Widok Settings (Ustawienia) umożliwia użytkownikowi zarządzanie kategoriami transakcji oraz ustawieniami konta. Jest to chroniony widok dostępny tylko dla zalogowanych użytkowników.

**Kluczowe funkcjonalności:**
- **Zarządzanie kategoriami** - dodawanie, edycja, usuwanie własnych kategorii
- **Systemowa kategoria "Inne"** - nieusuwalna i nieedytowalna, służy jako fallback
- **Automatyczne przypisanie transakcji** - po usunięciu kategorii, transakcje trafiają do "Inne"
- **Usuwanie konta** - trwałe usunięcie konta i wszystkich danych (zabezpieczone hasłem)
- **Licznik transakcji** - przy każdej kategorii pokazana liczba przypisanych transakcji

**Wymagania:**
- Widok chroniony (wymaga autentykacji)
- Desktop-only design (min-width: 1024px)
- Dark mode only
- Toast notifications dla wszystkich operacji
- Confirmation dialogs dla destructive actions (usuwanie kategorii, usuwanie konta)

## 2. Routing widoku

**Ścieżka:** `/settings`

**Middleware:** Wymaga autentykacji - chronione przez middleware

**Przekierowania:**
- Użytkownik niezalogowany → `/` (strona logowania)
- Po usunięciu konta → `/` (wylogowanie + redirect)

**Navigation:**
- Link w Header: "Ustawienia"
- Active state gdy user jest na `/settings`

## 3. Struktura komponentów

```
settings.astro
└─ AppLayout.astro
   ├─ Header.tsx (z active state dla Settings)
   │
   └─ Main Content
      ├─ PageHeader
      │  └─ Title: "Ustawienia"
      │
      ├─ ErrorBoundary.tsx
      │  └─ SettingsContent.tsx (client:load)
      │     │
      │     ├─ Section 1: Zarządzanie kategoriami
      │     │  ├─ SectionHeader
      │     │  │  ├─ Title: "Kategorie"
      │     │  │  ├─ Description
      │     │  │  └─ [+ Dodaj kategorię] button
      │     │  │
      │     │  └─ CategoriesList.tsx
      │     │     ├─ LoadingSkeleton (conditional)
      │     │     ├─ EmptyState (conditional)
      │     │     └─ CategoryItem.tsx × N
      │     │        ├─ Category info
      │     │        │  ├─ Name
      │     │        │  ├─ Transaction count badge
      │     │        │  └─ System badge (jeśli "Inne")
      │     │        │
      │     │        └─ Actions (jeśli NOT "Inne")
      │     │           ├─ [Edit] button
      │     │           └─ [Delete] button
      │     │
      │     ├─ Divider
      │     │
      │     └─ Section 2: Ustawienia konta
      │        ├─ SectionHeader
      │        │  └─ Title: "Konto"
      │        │
      │        └─ DeleteAccountSection.tsx
      │           ├─ Warning text
      │           └─ [Usuń konto] button (destructive)
      │
      ├─ CategoryModal.tsx (client:idle, lazy)
      │  └─ Dialog (Shadcn)
      │     ├─ DialogHeader
      │     ├─ CategoryForm
      │     │  └─ NameInput (z unique validation)
      │     └─ DialogFooter
      │        ├─ [Anuluj]
      │        └─ [Zapisz]
      │
      ├─ DeleteCategoryDialog.tsx (client:idle, lazy)
      │  └─ AlertDialog (Shadcn)
      │     ├─ AlertDialogHeader
      │     ├─ Category info + warning
      │     │  └─ Transaction count message
      │     └─ AlertDialogFooter
      │        ├─ [Anuluj]
      │        └─ [Usuń]
      │
      ├─ DeleteAccountDialog.tsx (client:idle, lazy)
      │  └─ AlertDialog (Shadcn)
      │     ├─ AlertDialogHeader
      │     ├─ Warning messages
      │     ├─ Password input (confirmation)
      │     ├─ Checkbox: "Rozumiem..."
      │     └─ AlertDialogFooter
      │        ├─ [Anuluj]
      │        └─ [Usuń konto]
      │
      └─ Toaster (client:load)
```

## 4. Szczegóły komponentów

### 4.1. SettingsContent.tsx

**Opis:**
Główny kontener zawartości Settings. Zarządza stanem modali i organizuje dwie główne sekcje.

**Główne elementy:**
- Section headers z opisami
- `<CategoriesList />` - lista kategorii
- `<DeleteAccountSection />` - sekcja usuwania konta
- State management dla modali

**Obsługiwane interakcje:**
- Click "+ Dodaj kategorię" → otwiera CategoryModal (mode="create")
- Click "Edit" przy kategorii → otwiera CategoryModal (mode="edit")
- Click "Delete" przy kategorii → otwiera DeleteCategoryDialog
- Click "Usuń konto" → otwiera DeleteAccountDialog

**Typy:**
```typescript
interface SettingsContentProps {
  // Brak propsów - pobiera dane z hooków
}
```

**State:**
```typescript
const [categoryModalState, setCategoryModalState] = useState<CategoryModalState>({
  isOpen: false,
  mode: 'create',
  category: undefined,
});

const [deleteCategoryDialogState, setDeleteCategoryDialogState] = useState<DeleteCategoryDialogState>({
  isOpen: false,
  category: undefined,
});

const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
```

### 4.2. CategoriesList.tsx

**Opis:**
Lista wszystkich kategorii użytkownika z loading i empty states.

**Główne elementy:**
- `<LoadingSkeleton />` - podczas ładowania
- `<EmptyState />` - gdy użytkownik nie ma kategorii (edge case - zawsze są domyślne)
- Lista `<CategoryItem />` × N
- Sortowanie: alfabetycznie, "Inne" zawsze na końcu

**Obsługiwane interakcje:**
- Hover na CategoryItem → pokazanie akcji
- Delegowanie onClick do parent (SettingsContent)

**Typy:**
```typescript
interface CategoriesListProps {
  onEditCategory: (category: CategoryDto) => void;
  onDeleteCategory: (category: CategoryDto) => void;
}
```

**Sortowanie logic:**
```typescript
const sortedCategories = useMemo(() => {
  if (!categories) return [];
  
  const otherCategory = categories.filter(c => !c.isDeletable);
  const userCategories = categories
    .filter(c => c.isDeletable)
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  
  return [...userCategories, ...otherCategory];
}, [categories]);
```

### 4.3. CategoryItem.tsx

**Opis:**
Pojedynczy element listy kategorii z nazwą, licznikiem transakcji i akcjami.

**Główne elementy:**
- `<div>` kontener z hover effect
- `<div>` - lewa strona:
  - Category name (bold)
  - Transaction count badge (np. "24 transakcje")
  - System badge (jeśli !isDeletable) - "Systemowa"
- `<div>` - prawa strona (akcje, widoczne on hover):
  - Edit button (ikona Pencil)
  - Delete button (ikona Trash)
  - Hidden jeśli !isDeletable

**Obsługiwane interakcje:**
- Hover → pokazanie przycisków akcji
- Click Edit → wywołanie onEdit callback
- Click Delete → wywołanie onDelete callback
- Keyboard: Focus + Enter → Edit, Focus + Delete key → Delete

**Typy:**
```typescript
interface CategoryItemProps {
  category: CategoryDto;
  transactionCount: number;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}
```

**Badge Logic:**
```typescript
const transactionCountText = useMemo(() => {
  if (transactionCount === 0) return 'Brak transakcji';
  if (transactionCount === 1) return '1 transakcja';
  if (transactionCount < 5) return `${transactionCount} transakcje`;
  return `${transactionCount} transakcji`;
}, [transactionCount]);
```

**Conditional Rendering:**
```typescript
{!category.isDeletable && (
  <Badge variant="secondary">Systemowa</Badge>
)}

{category.isDeletable && (
  <div className="actions">
    <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
      <Pencil className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" onClick={() => onDelete(category)}>
      <Trash className="w-4 h-4" />
    </Button>
  </div>
)}
```

### 4.4. CategoryModal.tsx

**Opis:**
Modal dodawania i edycji kategorii z walidacją unikalności nazwy.

**Główne elementy:**
- `<Dialog>` (Shadcn)
- `<DialogHeader>` - tytuł dynamiczny: "Dodaj kategorię" / "Edytuj kategorię"
- `<CategoryForm>` - formularz z jednym polem
- `<DialogFooter>` - akcje

**Obsługiwane interakcje:**
- Submit → walidacja → API call → zamknięcie
- Anuluj → zamknięcie
- Escape → zamknięcie
- Keyboard: Ctrl+Enter → submit

**Obsługiwana walidacja:**
```typescript
// Zod schema
{
  name: {
    required: true,
    min_length: 1,
    max_length: 100,
    unique: true (async check lub server-side)
  }
}
```

**Typy:**
```typescript
type CategoryModalMode = 'create' | 'edit';

interface CategoryModalProps {
  mode: CategoryModalMode;
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryDto; // Required dla mode="edit"
}
```

**State:**
```typescript
const form = useForm<CategoryFormData>({
  resolver: zodResolver(categoryFormSchema),
  defaultValues: mode === 'create' 
    ? { name: '' }
    : { name: category!.name },
});
```

### 4.5. CategoryForm.tsx

**Opis:**
Formularz kategorii - bardzo prosty, tylko jedno pole nazwy.

**Główne elementy:**
- `<Form>` wrapper (React Hook Form)
- `<FormField name="name">` - input nazwy kategorii
- Character counter (np. "15/100")
- Real-time validation feedback

**Obsługiwane interakcje:**
- Typing → real-time character count
- onChange → walidacja długości
- onBlur → walidacja unikalności (opcjonalnie async)

**Typy:**
```typescript
interface CategoryFormProps {
  mode: 'create' | 'edit';
  defaultValues?: { name: string };
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
}

type CategoryFormData = {
  name: string;
};
```

**Validation:**
- Required (nie może być puste)
- Min 1 znak, max 100 znaków
- Unique (nie może być duplikatu) - sprawdzane przez API
- Trim whitespace

### 4.6. DeleteCategoryDialog.tsx

**Opis:**
Alert dialog potwierdzenia usunięcia kategorii z informacją o transakcjach.

**Główne elementy:**
- `<AlertDialog>` (Shadcn)
- Category name display
- Transaction count warning
- Reassignment info: "Wszystkie transakcje zostaną przeniesione do 'Inne'"
- Destructive action button

**Obsługiwane interakcje:**
- Click "Usuń" → wywołanie onConfirm → zamknięcie
- Click "Anuluj" / Escape → zamknięcie bez akcji
- Loading state podczas usuwania

**Typy:**
```typescript
interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryDto;
  transactionCount: number;
  onConfirm: () => Promise<void>;
}
```

**Warning Message:**
```typescript
<AlertDialogDescription asChild>
  <div className="space-y-3">
    <p>Czy na pewno chcesz usunąć kategorię <strong>"{category.name}"</strong>?</p>
    
    {transactionCount > 0 && (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ta kategoria zawiera <strong>{transactionCount}</strong> {getTransactionText(transactionCount)}.
          Wszystkie zostaną automatycznie przeniesione do kategorii <strong>"Inne"</strong>.
        </AlertDescription>
      </Alert>
    )}
    
    <p className="text-sm text-muted-foreground">
      Ta operacja jest nieodwracalna.
    </p>
  </div>
</AlertDialogDescription>
```

### 4.7. DeleteAccountSection.tsx

**Opis:**
Sekcja w Settings z przyciskiem usuwania konta i ostrzeżeniem.

**Główne elementy:**
- `<div>` kontener sekcji
- Warning icon + tekst ostrzegawczy
- Opis konsekwencji usunięcia konta
- `<Button variant="destructive">` - "Usuń konto"

**Obsługiwane interakcje:**
- Click "Usuń konto" → otwiera DeleteAccountDialog

**Typy:**
```typescript
interface DeleteAccountSectionProps {
  onDeleteAccount: () => void;
}
```

**Warning Display:**
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Strefa niebezpieczna</AlertTitle>
  <AlertDescription>
    Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, 
    w tym transakcji, kategorii i ustawień. Ta operacja jest nieodwracalna.
  </AlertDescription>
</Alert>

<Button variant="destructive" onClick={onDeleteAccount} className="mt-4">
  <Trash className="w-4 h-4 mr-2" />
  Usuń konto
</Button>
```

### 4.8. DeleteAccountDialog.tsx

**Opis:**
Alert dialog z potwierdzeniem hasłem i checkbox dla usunięcia konta.

**Główne elementy:**
- `<AlertDialog>` (Shadcn)
- Severe warning message
- Password input (dla potwierdzenia tożsamości)
- Checkbox: "Rozumiem, że ta operacja jest nieodwracalna"
- Destructive action button

**Obsługiwane interakcje:**
- User wpisuje hasło
- User zaznacza checkbox
- Przycisk "Usuń konto" enabled tylko gdy: hasło niepuste AND checkbox checked
- Click "Usuń konto" → walidacja hasła → API call → logout → redirect

**Typy:**
```typescript
interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}
```

**State:**
```typescript
const [password, setPassword] = useState('');
const [confirmed, setConfirmed] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

const canDelete = password.length > 0 && confirmed && !isDeleting;
```

**Implementation:**
```tsx
<AlertDialog open={isOpen} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Usuń konto?</AlertDialogTitle>
      <AlertDialogDescription asChild>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>UWAGA:</strong> Ta operacja jest nieodwracalna!
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p>Zostaną trwale usunięte:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Wszystkie transakcje</li>
              <li>Wszystkie kategorie</li>
              <li>Twoje konto użytkownika</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="password">Potwierdź hasłem</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz swoje hasło"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(!!checked)}
            />
            <Label htmlFor="confirm" className="text-sm cursor-pointer">
              Rozumiem, że ta operacja jest nieodwracalna
            </Label>
          </div>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter>
      <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
        Anuluj
      </Button>
      <Button 
        variant="destructive" 
        onClick={handleDelete}
        disabled={!canDelete}
      >
        {isDeleting ? 'Usuwanie...' : 'Usuń konto'}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 5. Custom Hooks

### 5.1. useCategories.ts

**Opis:**
React Query hook dla pobierania listy kategorii (już zdefiniowany w Transaction Management).

```typescript
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minut
    refetchOnWindowFocus: false,
  });
}
```

### 5.2. useCategoryMutations.ts

**Opis:**
React Query mutations dla operacji CRUD na kategoriach.

```typescript
export function useCategoryMutations() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryCommand) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategoria dodana pomyślnie');
    },
    onError: (error: any) => {
      if (error.message.includes('409')) {
        toast.error('Kategoria o tej nazwie już istnieje');
      } else {
        toast.error('Nie udało się dodać kategorii');
      }
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryCommand }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Odświeża nazwy w transakcjach
      toast.success('Kategoria zaktualizowana pomyślnie');
    },
    onError: (error: any) => {
      if (error.message.includes('409')) {
        toast.error('Kategoria o tej nazwie już istnieje');
      } else if (error.message.includes('403')) {
        toast.error('Nie można edytować tej kategorii');
      } else {
        toast.error('Nie udało się zaktualizować kategorii');
      }
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Odświeża transakcje z nową kategorią "Inne"
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Odświeża dashboard
      toast.success('Kategoria usunięta pomyślnie');
    },
    onError: (error: any) => {
      if (error.message.includes('403')) {
        toast.error('Nie można usunąć tej kategorii');
      } else {
        toast.error('Nie udało się usunąć kategorii');
      }
    },
  });
  
  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
```

### 5.3. useCategoriesWithCount.ts

**Opis:**
Custom hook łączący kategorie z licznikiem transakcji.

```typescript
export function useCategoriesWithCount() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: allTransactions, isLoading: transactionsLoading } = useAllTransactions();
  
  const categoriesWithCount = useMemo(() => {
    if (!categories || !allTransactions) return [];
    
    return categories.map(category => {
      const count = allTransactions.filter(
        t => t.category.id === category.id
      ).length;
      
      return {
        ...category,
        transactionCount: count,
      };
    });
  }, [categories, allTransactions]);
  
  return {
    data: categoriesWithCount,
    isLoading: categoriesLoading || transactionsLoading,
  };
}

// Helper hook - pobiera wszystkie transakcje (dla count)
function useAllTransactions() {
  return useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: () => fetchAllTransactionsForCount(),
    staleTime: 60_000, // 1 minuta
  });
}
```

### 5.4. useDeleteAccount.ts

**Opis:**
Custom hook dla procesu usuwania konta.

```typescript
export function useDeleteAccount() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      // 1. Verify password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password,
      });
      
      if (error) {
        throw new Error('Nieprawidłowe hasło');
      }
      
      // 2. Delete user account (Supabase will cascade delete all data via DB triggers)
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się usunąć konta');
      }
    },
    onSuccess: async () => {
      // Clear all caches
      queryClient.clear();
      
      // Sign out
      await signOut();
      
      // Toast before redirect
      toast.success('Konto zostało usunięte');
      
      // Redirect to home
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się usunąć konta');
    },
  });
  
  return deleteAccountMutation;
}
```

## 6. Validation Schema (Zod)

### 6.1. categoryFormSchema

**Lokalizacja:** `src/lib/schemas/category.schema.ts`

```typescript
import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Nazwa kategorii jest wymagana' })
    .min(1, 'Nazwa kategorii nie może być pusta')
    .max(100, 'Nazwa kategorii może mieć maksymalnie 100 znaków')
    .trim()
    .refine(
      (name) => name.toLowerCase() !== 'inne',
      'Nie można użyć nazwy "Inne" (jest zarezerwowana)'
    ),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
```

**Uwaga:** Walidacja unikalności (czy kategoria o tej nazwie już istnieje) jest wykonywana przez API, które zwraca 409 Conflict.

## 7. API Integration

### 7.1. List Categories

**Endpoint:** `GET /api/categories`

**Service Function:**
```typescript
// src/lib/services/categories.service.ts

export async function fetchCategories(): Promise<CategoryDto[]> {
  const response = await fetch('/api/categories', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Nie udało się pobrać kategorii');
  }
  
  return response.json();
}
```

**Response Type:** `CategoryDto[]`
```typescript
[
  {
    id: "uuid",
    name: "Jedzenie",
    isDeletable: true
  },
  {
    id: "uuid",
    name: "Inne",
    isDeletable: false
  }
]
```

### 7.2. Create Category

**Endpoint:** `POST /api/categories`

**Service Function:**
```typescript
export async function createCategory(
  data: CreateCategoryCommand
): Promise<CategoryDto> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 409) {
      throw new Error('Kategoria o tej nazwie już istnieje');
    }
    
    throw new Error(error.message || 'Nie udało się dodać kategorii');
  }
  
  return response.json();
}
```

**Request Type:** `CreateCategoryCommand`
```typescript
{
  name: string;
}
```

**Response Type:** `CategoryDto`

**Error Responses:**
- 400 Bad Request - błędy walidacji
- 401 Unauthorized - brak autentykacji
- 409 Conflict - kategoria o tej nazwie już istnieje
- 500 Internal Server Error

### 7.3. Update Category

**Endpoint:** `PATCH /api/categories/{id}`

**Service Function:**
```typescript
export async function updateCategory(
  id: string,
  data: UpdateCategoryCommand
): Promise<CategoryDto> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 403) {
      throw new Error('Nie można edytować tej kategorii');
    }
    
    if (response.status === 404) {
      throw new Error('Kategoria nie została znaleziona');
    }
    
    if (response.status === 409) {
      throw new Error('Kategoria o tej nazwie już istnieje');
    }
    
    throw new Error(error.message || 'Nie udało się zaktualizować kategorii');
  }
  
  return response.json();
}
```

**Request Type:** `UpdateCategoryCommand`
```typescript
{
  name: string;
}
```

### 7.4. Delete Category

**Endpoint:** `DELETE /api/categories/{id}`

**Service Function:**
```typescript
export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 403) {
      throw new Error('Nie można usunąć tej kategorii');
    }
    
    if (response.status === 404) {
      throw new Error('Kategoria nie została znaleziona');
    }
    
    throw new Error(error.message || 'Nie udało się usunąć kategorii');
  }
  
  // 204 No Content - success
  // Database trigger automatically reassigns transactions to "Inne"
}
```

**Important:** Backend trigger (BEFORE DELETE) automatycznie przypisuje wszystkie transakcje z usuwanej kategorii do kategorii "Inne" przed usunięciem.

### 7.5. Delete Account

**Endpoint:** `DELETE /api/auth/delete-account` (do utworzenia)

**Service Function:**
```typescript
export async function deleteUserAccount(): Promise<void> {
  const response = await fetch('/api/auth/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Nie udało się usunąć konta');
  }
  
  // 204 No Content - success
  // Database CASCADE deletes:
  // - User profile
  // - All categories
  // - All transactions
  // - auth.users record
}
```

**Alternative:** Użycie Supabase Admin API:
```typescript
// W API endpoint /api/auth/delete-account
const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
```

## 8. User Flows

### 8.1. Dodawanie kategorii

**Happy Path:**
1. Użytkownik na Settings page
2. Widzi sekcję "Kategorie" z listą istniejących kategorii
3. Klika przycisk "+ Dodaj kategorię"
4. Otwiera się `CategoryModal` w trybie `create`
5. Focus automatycznie na polu Name
6. User wpisuje nazwę: "Transport"
7. Real-time walidacja: długość OK ✓
8. Klika "Zapisz" (lub Ctrl+Enter)
9. Loading state na przycisku
10. API call: POST /api/categories
11. Response success (201):
    - Modal zamyka się
    - Toast: "Kategoria dodana pomyślnie"
    - Nowa kategoria pojawia się na liście (alfabetycznie)
    - Kategoria dostępna w dropdown w TransactionForm

**Error Path - duplikat:**
1. Kroki 1-10 jak wyżej
2. API zwraca 409 Conflict (kategoria "Transport" już istnieje)
3. Toast error: "Kategoria o tej nazwie już istnieje"
4. Modal pozostaje otwarty
5. User zmienia nazwę na "Transport publiczny"
6. Submit → sukces

**Error Path - nazwa "Inne":**
1. User próbuje dodać kategorię "Inne"
2. Walidacja Zod: "Nie można użyć nazwy 'Inne' (jest zarezerwowana)"
3. Error message pod polem
4. Przycisk "Zapisz" disabled
5. User zmienia nazwę

### 8.2. Edycja kategorii

**Happy Path:**
1. User hover na CategoryItem (np. "Jedzenie")
2. Pokazują się przyciski akcji
3. Klika ikonę edycji
4. Otwiera się `CategoryModal` w trybie `edit`
5. Pole Name pre-filled: "Jedzenie"
6. User modyfikuje: "Jedzenie i napoje"
7. Klika "Zapisz"
8. Loading state
9. API call: PATCH /api/categories/{id}
10. Response success (200):
    - Modal zamyka się
    - Toast: "Kategoria zaktualizowana pomyślnie"
    - Nazwa kategorii aktualizuje się na liście
    - Nazwa aktualizuje się we wszystkich transakcjach (invalidate queries)

**Special Case - edycja "Inne":**
1. User widzi kategorię "Inne" z badge "Systemowa"
2. Brak przycisku Edit (hidden)
3. Nie można edytować

### 8.3. Usuwanie kategorii

**Happy Path:**
1. User klika ikonę usunięcia przy kategorii "Transport" (3 transakcje)
2. Otwiera się `DeleteCategoryDialog`
3. Dialog pokazuje:
   ```
   Czy na pewno chcesz usunąć kategorię "Transport"?
   
   [⚠️ Alert]
   Ta kategoria zawiera 3 transakcje.
   Wszystkie zostaną automatycznie przeniesione do kategorii "Inne".
   
   Ta operacja jest nieodwracalna.
   ```
4. User klika "Usuń"
5. Loading state
6. API call: DELETE /api/categories/{id}
7. Backend trigger (BEFORE DELETE):
   - Znajduje wszystkie transakcje z category_id = {id}
   - Ustawia ich category_id = {id kategorii "Inne"}
   - Następnie usuwa kategorię
8. Response success (204):
   - Dialog zamyka się
   - Toast: "Kategoria usunięta pomyślnie"
   - Kategoria znika z listy
   - Transakcje odświeżają się (pokazują "Inne")
   - Dashboard odświeża dane

**Special Case - kategoria bez transakcji:**
1. Usuwanie kategorii "Test" (0 transakcji)
2. Dialog pokazuje: "Ta kategoria nie zawiera transakcji"
3. Brak alertu o przeniesieniu
4. Reszta procesu jak wyżej

**Special Case - usuwanie "Inne":**
1. User widzi kategorię "Inne" z badge "Systemowa"
2. Brak przycisku Delete (hidden)
3. Nie można usunąć

### 8.4. Usuwanie konta

**Happy Path:**
1. User na Settings scrolluje do sekcji "Konto"
2. Widzi czerwony alert z ostrzeżeniem
3. Klika "Usuń konto" (destructive button)
4. Otwiera się `DeleteAccountDialog`
5. Dialog pokazuje severe warnings:
   - Lista co zostanie usunięte
   - Input hasła
   - Checkbox potwierdzenia
6. User wpisuje hasło
7. User zaznacza checkbox "Rozumiem..."
8. Przycisk "Usuń konto" staje się enabled
9. User klika "Usuń konto"
10. Loading state: "Usuwanie..."
11. API verifies password
12. Password correct → proceed
13. API call: DELETE /api/auth/delete-account
14. Backend (Supabase + DB CASCADE):
    - Deletes auth.users record
    - Cascade triggers delete:
      - profiles record
      - wszystkie categories
      - wszystkie transactions
15. Response success:
    - Clear React Query cache
    - Sign out (Supabase)
    - Toast: "Konto zostało usunięte"
    - Redirect to `/` (login page)

**Error Path - wrong password:**
1. Kroki 1-11 jak wyżej
2. Password verification fails
3. Toast error: "Nieprawidłowe hasło"
4. Dialog pozostaje otwarty
5. User może spróbować ponownie

**Safety Checks:**
- Przycisk disabled jeśli: !password || !confirmed
- No way to delete account without password confirmation
- Checkbox wymusza świadome potwierdzenie

## 9. Warunki i walidacja

### 9.1. Walidacja formularza kategorii

**Pole Name:**
- ✓ Required (min 1 znak)
- ✓ Max 100 znaków
- ✓ Trim whitespace
- ✓ Nie może być "Inne" (case-insensitive)
- ✓ Unique (sprawdzane przez API - 409 Conflict)

**Character counter:**
- Display: "{current}/100"
- Warning color (żółty) gdy >90 znaków
- Error color (czerwony) gdy >100 znaków (submit disabled)

### 9.2. Warunki wyświetlania przycisków akcji

**Edit button:**
- Pokazany gdy: `category.isDeletable === true`
- Hidden gdy: `category.isDeletable === false` (systemowa "Inne")

**Delete button:**
- Pokazany gdy: `category.isDeletable === true`
- Hidden gdy: `category.isDeletable === false`

**Przycisk "Zapisz" w CategoryModal:**
- Disabled gdy: `!form.formState.isValid || isSubmitting`
- Enabled gdy: formularz valid i nie trwa submit

**Przycisk "Usuń konto" w DeleteAccountDialog:**
- Disabled gdy: `!password || !confirmed || isDeleting`
- Enabled gdy: hasło wpisane AND checkbox zaznaczony AND nie trwa usuwanie

### 9.3. Loading States

**CategoriesList:**
- Loading skeleton gdy: `isLoading === true`
- Lista gdy: `!isLoading && categories.length > 0`
- Empty state gdy: `!isLoading && categories.length === 0` (unlikely - domyślne istnieją)

**CategoryItem actions:**
- Spinner na przycisku podczas mutation
- Cała lista disabled podczas usuwania

**DeleteAccountDialog:**
- Przycisk: "Usuń konto" → "Usuwanie..." podczas mutation
- Wszystkie inputy disabled podczas mutation

## 10. Obsługa błędów

### 10.1. Błędy API - Categories

**HTTP Error Codes:**

| Code | Error | UI Action |
|------|-------|-----------|
| 400 | Validation error | Show field errors |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden (edit/delete "Inne") | Toast: "Nie można edytować/usunąć tej kategorii" |
| 404 | Category not found | Toast: "Kategoria nie została znaleziona" + refresh list |
| 409 | Duplicate name | Toast: "Kategoria o tej nazwie już istnieje" + focus na pole |
| 500 | Server error | Toast: "Błąd serwera" |

**Toast Messages:**
```typescript
// Success
toast.success('Kategoria dodana pomyślnie');
toast.success('Kategoria zaktualizowana pomyślnie');
toast.success('Kategoria usunięta pomyślnie');

// Errors
toast.error('Kategoria o tej nazwie już istnieje');
toast.error('Nie można edytować tej kategorii');
toast.error('Nie można usunąć tej kategorii');
toast.error('Kategoria nie została znaleziona');
```

### 10.2. Błędy API - Delete Account

| Code | Error | UI Action |
|------|-------|-----------|
| 401 | Wrong password | Toast: "Nieprawidłowe hasło" + stay in dialog |
| 403 | Forbidden | Toast: "Brak uprawnień" |
| 500 | Server error | Toast: "Nie udało się usunąć konta" + retry option |

### 10.3. Edge Cases

**Scenario: Category deleted elsewhere**
1. User otwiera edit modal dla kategorii A
2. W innej karcie/urządzeniu kategoria A zostaje usunięta
3. User submits changes
4. API zwraca 404
5. Toast: "Kategoria nie została znaleziona"
6. Modal zamyka się
7. Lista kategorii odświeża się

**Scenario: Last user category**
1. User ma tylko kategorie: "Jedzenie" (deletable) + "Inne" (system)
2. User usuwa "Jedzenie"
3. Zostaje tylko "Inne"
4. User może dodać nowe kategorie normalnie

**Scenario: Network error podczas delete account**
1. User potwierdza usunięcie konta
2. Network fail podczas API call
3. Error caught
4. Toast: "Sprawdź połączenie internetowe"
5. Dialog pozostaje otwarty
6. User może spróbować ponownie
7. Konto NIE zostaje usunięte (bezpieczny fail)

## 11. Accessibility (a11y)

### 11.1. ARIA Labels

```tsx
<Button aria-label="Dodaj kategorię" onClick={handleAddCategory}>
  <Plus className="w-4 h-4" />
</Button>

<Button 
  aria-label={`Edytuj kategorię ${category.name}`}
  onClick={() => handleEdit(category)}
>
  <Pencil className="w-4 h-4" />
</Button>

<Button 
  aria-label={`Usuń kategorię ${category.name}`}
  onClick={() => handleDelete(category)}
>
  <Trash className="w-4 h-4" />
</Button>
```

### 11.2. Focus Management

**CategoryModal open:**
- Auto-focus na input Name

**CategoryModal close:**
- Return focus do przycisku który otworzył modal (+ Dodaj lub Edit)

**DeleteCategoryDialog:**
- Focus na przycisk "Anuluj" (safer default)

**DeleteAccountDialog:**
- Focus na password input przy otwarciu

### 11.3. Keyboard Navigation

**Categories list:**
- Tab przez wszystkie CategoryItems
- Focus na item + Enter → Edit modal
- Focus na item + Delete key → Delete dialog

**Modals:**
- Escape → zamknięcie
- Ctrl+Enter → submit (CategoryModal)
- Tab order logiczny

### 11.4. Screen Reader Support

**Category count announcement:**
```tsx
<span aria-label={`${transactionCount} transakcji w tej kategorii`}>
  {transactionCountText}
</span>
```

**System badge:**
```tsx
<Badge aria-label="Kategoria systemowa, nie można edytować ani usunąć">
  Systemowa
</Badge>
```

**Loading states:**
```tsx
<div aria-busy="true" aria-label="Ładowanie kategorii">
  <LoadingSkeleton />
</div>
```

## 12. Kroki implementacji

### Krok 1: Setup Dependencies

1.1. Shadcn UI components (sprawdź czy zainstalowane):
```bash
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
```

### Krok 2: API Endpoints

2.1. Sprawdź czy istnieją (powinny być już zaimplementowane):
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/{id}`
- `DELETE /api/categories/{id}`

2.2. Utwórz nowy endpoint `DELETE /api/auth/delete-account`:
```typescript
// src/pages/api/auth/delete-account.ts

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@/db/supabase.admin';

export const DELETE: APIRoute = async ({ locals }) => {
  try {
    const { data: { user }, error: authError } = 
      await locals.supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Delete user (CASCADE will handle profiles, categories, transactions)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );
    
    if (deleteError) {
      throw deleteError;
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[Delete Account API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
};
```

### Krok 3: Database Trigger (jeśli nie istnieje)

3.1. Sprawdź czy istnieje trigger dla reassigning transactions:
```sql
-- W migrations/
CREATE OR REPLACE FUNCTION reassign_transactions_before_category_delete()
RETURNS trigger AS $$
DECLARE
  other_category_id uuid;
BEGIN
  -- Find "Inne" category for this user
  SELECT id INTO other_category_id
  FROM categories
  WHERE user_id = OLD.user_id AND is_deletable = false
  LIMIT 1;
  
  -- Reassign all transactions to "Inne"
  UPDATE transactions
  SET category_id = other_category_id
  WHERE category_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_delete_category
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION reassign_transactions_before_category_delete();
```

### Krok 4: Validation Schema

4.1. Utwórz `src/lib/schemas/category.schema.ts`:
```typescript
import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Nazwa kategorii jest wymagana' })
    .min(1, 'Nazwa kategorii nie może być pusta')
    .max(100, 'Nazwa kategorii może mieć maksymalnie 100 znaków')
    .trim()
    .refine(
      (name) => name.toLowerCase() !== 'inne',
      'Nie można użyć nazwy "Inne" (jest zarezerwowana)'
    ),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
```

### Krok 5: Service Layer

5.1. Dodaj funkcje do `src/lib/services/categories.service.ts`:
```typescript
export async function createCategory(data: CreateCategoryCommand): Promise<CategoryDto>
export async function updateCategory(id: string, data: UpdateCategoryCommand): Promise<CategoryDto>
export async function deleteCategory(id: string): Promise<void>
```

5.2. Utwórz `src/lib/services/auth.service.ts`:
```typescript
export async function deleteUserAccount(): Promise<void>
```

### Krok 6: Custom Hooks - Mutations

6.1. Utwórz `src/lib/hooks/useCategoryMutations.ts`:
- createMutation
- updateMutation
- deleteMutation
- Toast notifications
- Query invalidation

6.2. Utwórz `src/lib/hooks/useDeleteAccount.ts`:
- Password verification logic
- Account deletion
- Cleanup (cache, logout, redirect)

### Krok 7: Custom Hooks - Data

7.1. Utwórz `src/lib/hooks/useCategoriesWithCount.ts`:
- Combine categories z transaction counts
- Wykorzystaj istniejący useCategories

### Krok 8: Basic Components - CategoryItem

8.1. Utwórz `src/components/settings/CategoryItem.tsx`:
- Layout: name, badges, transaction count, actions
- Conditional rendering (isDeletable)
- Hover effects
- Action callbacks

### Krok 9: Basic Components - CategoriesList

9.1. Utwórz `src/components/settings/CategoriesList.tsx`:
- Map przez categories
- Sortowanie (alfabetycznie + "Inne" last)
- Loading skeleton
- Empty state (opcjonalnie)

### Krok 10: Category Form

10.1. Utwórz `src/components/settings/CategoryForm.tsx`:
- React Hook Form setup
- Single input field (Name)
- Character counter
- Validation

### Krok 11: Category Modal

11.1. Utwórz `src/components/settings/CategoryModal.tsx`:
- Dialog component
- Mode logic (create vs edit)
- Integration z useCategoryMutations
- Form submission

### Krok 12: Delete Category Dialog

12.1. Utwórz `src/components/settings/DeleteCategoryDialog.tsx`:
- AlertDialog
- Category summary
- Transaction count warning
- Reassignment message
- Confirmation flow

### Krok 13: Delete Account Section

13.1. Utwórz `src/components/settings/DeleteAccountSection.tsx`:
- Warning alert (destructive variant)
- Description of consequences
- Destructive button

### Krok 14: Delete Account Dialog

14.1. Utwórz `src/components/settings/DeleteAccountDialog.tsx`:
- AlertDialog z severe warnings
- Password input
- Confirmation checkbox
- Multi-step safety checks
- Integration z useDeleteAccount

### Krok 15: Main Settings Content

15.1. Utwórz `src/components/settings/SettingsContent.tsx`:
- Two sections layout
- State management dla modali
- Integration wszystkich sub-komponentów
- Event handlers

### Krok 16: Settings Page

16.1. Utwórz `src/pages/settings.astro`:
- Use AppLayout
- Server-side auth check
- Render SettingsContent client:load
- Page header

16.2. Update Header.tsx:
- Add Settings link
- Active state detection

### Krok 17: Styling

17.1. Section headers styling:
- Clear visual separation
- Typography hierarchy

17.2. Categories list:
- Card-based items
- Hover states
- Smooth transitions

17.3. Danger zone styling:
- Red/destructive theme
- Clear visual warnings

### Krok 18: Testing - Unit Tests

18.1. Test categoryFormSchema:
```typescript
describe('categoryFormSchema', () => {
  it('validates correct name', () => {
    expect(categoryFormSchema.parse({ name: 'Transport' })).toBeTruthy();
  });
  
  it('rejects empty name', () => {
    expect(() => categoryFormSchema.parse({ name: '' })).toThrow();
  });
  
  it('rejects "Inne" name', () => {
    expect(() => categoryFormSchema.parse({ name: 'Inne' })).toThrow();
  });
  
  it('trims whitespace', () => {
    const result = categoryFormSchema.parse({ name: '  Transport  ' });
    expect(result.name).toBe('Transport');
  });
});
```

18.2. Test sorting logic:
```typescript
describe('CategoriesList sorting', () => {
  it('sorts alphabetically with "Inne" last', () => {
    const categories = [
      { name: 'Inne', isDeletable: false },
      { name: 'Zakupy', isDeletable: true },
      { name: 'Auto', isDeletable: true },
    ];
    
    const sorted = sortCategories(categories);
    
    expect(sorted[0].name).toBe('Auto');
    expect(sorted[1].name).toBe('Zakupy');
    expect(sorted[2].name).toBe('Inne');
  });
});
```

### Krok 19: Testing - Component Tests

19.1. Test CategoryItem:
```typescript
describe('CategoryItem', () => {
  it('shows edit and delete buttons for deletable category', () => {
    const category = { name: 'Test', isDeletable: true };
    render(<CategoryItem category={category} onEdit={vi.fn()} onDelete={vi.fn()} />);
    
    expect(screen.getByLabelText(/edytuj/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/usuń/i)).toBeInTheDocument();
  });
  
  it('hides action buttons for system category', () => {
    const category = { name: 'Inne', isDeletable: false };
    render(<CategoryItem category={category} onEdit={vi.fn()} onDelete={vi.fn()} />);
    
    expect(screen.queryByLabelText(/edytuj/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/usuń/i)).not.toBeInTheDocument();
  });
  
  it('shows system badge for "Inne"', () => {
    const category = { name: 'Inne', isDeletable: false };
    render(<CategoryItem category={category} />);
    
    expect(screen.getByText(/systemowa/i)).toBeInTheDocument();
  });
});
```

19.2. Test CategoryModal:
```typescript
describe('CategoryModal', () => {
  it('creates new category', async () => {
    const onClose = vi.fn();
    render(<CategoryModal mode="create" isOpen onClose={onClose} />);
    
    await userEvent.type(screen.getByLabelText(/nazwa/i), 'Nowa kategoria');
    await userEvent.click(screen.getByRole('button', { name: /zapisz/i }));
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
  
  it('shows duplicate error', async () => {
    // Mock API to return 409
    server.use(
      rest.post('/api/categories', (req, res, ctx) => {
        return res(ctx.status(409));
      })
    );
    
    render(<CategoryModal mode="create" isOpen />);
    await userEvent.type(screen.getByLabelText(/nazwa/i), 'Existing');
    await userEvent.click(screen.getByRole('button', { name: /zapisz/i }));
    
    expect(await screen.findByText(/już istnieje/i)).toBeInTheDocument();
  });
});
```

19.3. Test DeleteAccountDialog:
```typescript
describe('DeleteAccountDialog', () => {
  it('disables submit button when conditions not met', () => {
    render(<DeleteAccountDialog isOpen onClose={vi.fn()} onConfirm={vi.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /usuń konto/i });
    expect(submitButton).toBeDisabled();
  });
  
  it('enables submit when password and checkbox filled', async () => {
    render(<DeleteAccountDialog isOpen onClose={vi.fn()} onConfirm={vi.fn()} />);
    
    await userEvent.type(screen.getByLabelText(/hasło/i), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: /usuń konto/i });
    expect(submitButton).toBeEnabled();
  });
});
```

### Krok 20: Testing - E2E

20.1. Test category CRUD flow:
```typescript
test('user can manage categories', async ({ page }) => {
  await page.goto('/settings');
  
  // Add category
  await page.click('text=Dodaj kategorię');
  await page.fill('[name="name"]', 'Nowa kategoria');
  await page.click('button:has-text("Zapisz")');
  await expect(page.locator('text=Kategoria dodana pomyślnie')).toBeVisible();
  await expect(page.locator('text=Nowa kategoria')).toBeVisible();
  
  // Edit category
  await page.hover('text=Nowa kategoria');
  await page.click('[aria-label*="Edytuj"]');
  await page.fill('[name="name"]', 'Zaktualizowana kategoria');
  await page.click('button:has-text("Zapisz")');
  await expect(page.locator('text=Zaktualizowana kategoria')).toBeVisible();
  
  // Delete category
  await page.hover('text=Zaktualizowana kategoria');
  await page.click('[aria-label*="Usuń"]');
  await page.click('button:has-text("Usuń")');
  await expect(page.locator('text=Kategoria usunięta pomyślnie')).toBeVisible();
});
```

20.2. Test delete account flow (use test account):
```typescript
test('user can delete account with password confirmation', async ({ page }) => {
  // Login first
  await page.goto('/');
  await page.fill('[name="email"]', 'test@delete.com');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('button:has-text("Zaloguj")');
  
  // Navigate to settings
  await page.goto('/settings');
  
  // Click delete account
  await page.click('text=Usuń konto');
  
  // Fill password and confirm
  await page.fill('[type="password"]', 'testpassword');
  await page.click('[type="checkbox"]');
  await page.click('button:has-text("Usuń konto")');
  
  // Should be redirected to login
  await page.waitForURL('/');
  await expect(page.locator('text=Konto zostało usunięte')).toBeVisible();
});
```

### Krok 21: Accessibility Audit

21.1. Keyboard navigation:
- Tab przez całą stronę Settings
- Enter/Space na wszystkich przyciskach
- Focus states visible

21.2. ARIA labels:
- Wszystkie icon buttons mają aria-label
- Alerts mają role="alert"
- Loading states z aria-busy

21.3. Screen reader test:
- Category items announced correctly
- Transaction counts announced
- System badges announced

### Krok 22: Performance

22.1. Memoization:
```typescript
const MemoizedCategoryItem = memo(CategoryItem);
const sortedCategories = useMemo(() => sortCategories(categories), [categories]);
```

22.2. Lazy loading modals:
```typescript
const CategoryModal = lazy(() => import('./CategoryModal'));
const DeleteCategoryDialog = lazy(() => import('./DeleteCategoryDialog'));
```

### Krok 23: Documentation

23.1. JSDoc dla komponentów:
```typescript
/**
 * Settings page main content component.
 * Manages categories and account settings.
 */
export function SettingsContent() { ... }
```

23.2. README dla Settings:
- Jak dodawać kategorie
- Jak działa reassignment do "Inne"
- Proces usuwania konta

### Krok 24: Final Polish

24.1. Visual refinement:
- Spacing consistency
- Color scheme (danger zone red)
- Hover/focus states smooth

24.2. Copy review:
- Wszystkie komunikaty po polsku
- Friendly tone w warnings
- Clear error messages

24.3. Final integration test:
- Test całego flow Settings → Categories → Transactions
- Verify kategoria usunięta → transakcje w "Inne"
- Verify kategoria zmieniona → nazwa w transakcjach updated

---

## Podsumowanie

Ten plan implementacji zapewnia kompleksowy przewodnik do stworzenia widoku Settings w aplikacji Settlements.

**Kluczowe elementy:**
- **Zarządzanie kategoriami** - pełny CRUD z walidacją unikalności
- **Systemowa kategoria "Inne"** - nieusuwalna, fallback dla orphaned transactions
- **Automatyczne reassignment** - database trigger przenosi transakcje przed usunięciem kategorii
- **Usuwanie konta** - multi-step confirmation (password + checkbox)
- **Licznik transakcji** - pokazany przy każdej kategorii
- **Safety-first approach** - confirmation dialogs, clear warnings, rollback capability

**Komponenty:**
- SettingsContent (main container)
- CategoriesList (list z sortowaniem)
- CategoryItem (single item z actions)
- CategoryModal (add/edit form)
- DeleteCategoryDialog (confirmation)
- DeleteAccountSection (danger zone)
- DeleteAccountDialog (multi-step confirmation)

**Custom Hooks:**
- useCategoryMutations (create/update/delete)
- useCategoriesWithCount (combine categories + counts)
- useDeleteAccount (account deletion flow)

Po implementacji użytkownicy będą mogli:
✅ Dodawać własne kategorie
✅ Edytować nazwy kategorii
✅ Usuwać kategorie (z automatycznym przeniesieniem transakcji)
✅ Widzieć liczbę transakcji w każdej kategorii
✅ Bezpiecznie usunąć konto z potwierdzeniem hasłem

Widok jest zaprojektowany z naciskiem na bezpieczeństwo (destructive actions require confirmation) i user experience (clear feedback, no data loss).

