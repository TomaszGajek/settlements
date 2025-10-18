# Plan implementacji widoku Authentication (Login/Register)

## 1. Przegląd

Widok Authentication jest punktem wejścia do aplikacji Settlements, odpowiedzialnym za uwierzytelnianie użytkowników. Składa się z dwóch głównych formularzy:

- **Logowanie** - dla istniejących użytkowników
- **Rejestracja** - dla nowych użytkowników

Po pomyślnym zalogowaniu lub rejestracji użytkownik jest przekierowywany do widoku Dashboard. Widok wykorzystuje Supabase Auth do zarządzania sesjami i autentykacją.

**Kluczowe funkcjonalności:**

- Logowanie z walidacją email/hasło
- Rejestracja nowego konta z walidacją
- Link do resetowania hasła
- Automatyczne przekierowanie po sukcesie
- Obsługa błędów (np. błędne dane, zajęty email)
- Utrzymywanie sesji użytkownika

Widok jest zoptymalizowany pod kątem desktop (min-width: 1024px) i korzysta wyłącznie z ciemnego motywu.

## 2. Routing widoku

**Ścieżka główna:** `/` (index.astro)

**Dodatkowe ścieżki:**

- `/reset-password` - strona resetowania hasła

**Parametry URL:**

- `?tab=login` - domyślna zakładka logowania (opcjonalne)
- `?tab=register` - zakładka rejestracji (opcjonalne)
- `?reason=session_expired` - informacja o wygaśnięciu sesji (opcjonalne)
- `?email={email}` - pre-fill email w formularzu (opcjonalne, dla reset password)

**Middleware:**

- Strona **publiczna** - dostępna dla niezalogowanych użytkowników
- Jeśli użytkownik już zalogowany → redirect do `/dashboard`

**Przekierowania:**

- Po pomyślnym logowaniu → `/dashboard?month={current}&year={current}`
- Po pomyślnej rejestracji → `/dashboard?month={current}&year={current}` (auto-login)
- Po kliknięciu "Zapomniałem hasła" → `/reset-password`

## 3. Struktura komponentów

```
index.astro (/)
└─ AuthLayout.astro
   ├─ Logo / App branding (centered)
   │
   └─ AuthCard (centered card)
      ├─ Tabs.tsx (client:load)
      │  ├─ TabsList
      │  │  ├─ TabsTrigger: "Logowanie"
      │  │  └─ TabsTrigger: "Rejestracja"
      │  │
      │  ├─ TabsContent: Login
      │  │  └─ LoginForm.tsx (client:load)
      │  │     ├─ EmailInput
      │  │     ├─ PasswordInput (with show/hide toggle)
      │  │     ├─ Link: "Zapomniałem hasła"
      │  │     ├─ SubmitButton: "Zaloguj"
      │  │     └─ ErrorDisplay
      │  │
      │  └─ TabsContent: Register
      │     └─ RegisterForm.tsx (client:load)
      │        ├─ EmailInput
      │        ├─ PasswordInput (with requirements indicator)
      │        ├─ ConfirmPasswordInput
      │        ├─ SubmitButton: "Zarejestruj"
      │        └─ ErrorDisplay
      │
      └─ Toaster (client:load)

reset-password.astro (/reset-password)
└─ AuthLayout.astro
   └─ ResetPasswordCard
      └─ ResetPasswordForm.tsx (client:load)
         ├─ EmailInput
         ├─ SubmitButton: "Wyślij link resetujący"
         └─ BackToLoginLink
```

## 4. Szczegóły komponentów

### 4.1. LoginForm.tsx

**Opis:**
Formularz logowania z walidacją email i hasła. Integruje się z Supabase Auth do weryfikacji użytkownika.

**Główne elementy:**

- `<Form>` - wrapper formularza (React Hook Form)
- `<FormField name="email">` - pole email z walidacją formatu
- `<FormField name="password">` - pole hasła z toggle show/hide
- `<Link>` - "Zapomniałem hasła" → `/reset-password`
- `<Button type="submit">` - przycisk "Zaloguj" z loading state
- `<Alert>` - wyświetlanie błędów (jeśli wystąpią)

**Obsługiwane interakcje:**

- Submit formularza → walidacja → Supabase Auth login → redirect do dashboard
- Click "Zapomniałem hasła" → przekierowanie do `/reset-password`
- Toggle password visibility → zmiana type input (text/password)
- Enter w polu → submit formularza
- Focus management: auto-focus na email przy montowaniu

**Obsługiwana walidacja (Zod schema):**

```typescript
{
  email: {
    required: true,
    format: "email" (regex validation)
  },
  password: {
    required: true,
    min_length: 6
  }
}
```

**Typy:**

- `LoginFormData` - dane formularza
- `LoginFormProps` - propsy komponentu

**Propsy:**

```typescript
interface LoginFormProps {
  defaultEmail?: string; // Pre-fill email (np. z URL param)
  onSuccess?: () => void; // Callback po sukcesie (opcjonalne)
}
```

### 4.2. RegisterForm.tsx

**Opis:**
Formularz rejestracji nowego użytkownika z walidacją email, hasła i potwierdzenia hasła.

**Główne elementy:**

- `<Form>` - wrapper formularza (React Hook Form)
- `<FormField name="email">` - pole email
- `<FormField name="password">` - pole hasła z:
  - Toggle show/hide
  - Password strength indicator (opcjonalne dla MVP)
  - Requirements checklist (min 6 znaków)
- `<FormField name="confirmPassword">` - pole potwierdzenia hasła
- `<Button type="submit">` - przycisk "Zarejestruj" z loading state
- `<Alert>` - wyświetlanie błędów

**Obsługiwane interakcje:**

- Submit formularza → walidacja → Supabase Auth signup → auto-login → redirect do dashboard
- Toggle password visibility dla obu pól hasła
- Real-time walidacja czy hasła się zgadzają
- Enter w polu → submit formularza

**Obsługiwana walidacja (Zod schema):**

```typescript
{
  email: {
    required: true,
    format: "email",
    async_check: "unique" (handled by Supabase)
  },
  password: {
    required: true,
    min_length: 6,
    // Opcjonalne dla przyszłości: uppercase, number, special char
  },
  confirmPassword: {
    required: true,
    matches: password (custom refinement)
  }
}
```

**Typy:**

- `RegisterFormData` - dane formularza
- `RegisterFormProps` - propsy komponentu

**Propsy:**

```typescript
interface RegisterFormProps {
  onSuccess?: () => void; // Callback po sukcesie
}
```

### 4.3. ResetPasswordForm.tsx

**Opis:**
Formularz resetowania hasła - wysyła email z linkiem resetującym poprzez Supabase Auth.

**Główne elementy:**

- `<Form>` - wrapper formularza
- `<FormField name="email">` - pole email
- `<Button type="submit">` - przycisk "Wyślij link resetujący"
- `<Link>` - "Powrót do logowania" → `/`
- `<Alert variant="success">` - potwierdzenie wysłania (jeśli sukces)

**Obsługiwane interakcje:**

- Submit → Supabase Auth resetPasswordForEmail → wyświetlenie komunikatu sukcesu
- Click "Powrót do logowania" → przekierowanie do `/`

**Obsługiwana walidacja:**

```typescript
{
  email: {
    required: true,
    format: "email"
  }
}
```

**Typy:**

- `ResetPasswordFormData` - dane formularza
- `ResetPasswordFormProps` - propsy komponentu

**Propsy:**

```typescript
interface ResetPasswordFormProps {
  defaultEmail?: string; // Pre-fill z URL
}
```

### 4.4. PasswordInput.tsx

**Opis:**
Reużywalny komponent input dla hasła z funkcją show/hide.

**Główne elementy:**

- `<div>` - wrapper relative positioning
- `<Input type={showPassword ? "text" : "password"}>` - pole input
- `<Button variant="ghost">` - toggle button z ikoną Eye/EyeOff (Lucide)

**Obsługiwane interakcje:**

- Click na ikonie oka → toggle visibility hasła
- Wszystkie standardowe input interactions (focus, blur, change)

**Obsługiwana walidacja:**

- Przekazywana z parent component (React Hook Form)

**Typy:**

- `PasswordInputProps` - propsy extending InputHTMLAttributes

**Propsy:**

```typescript
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showRequirements?: boolean; // Pokazać checklist wymagań hasła
  value?: string; // Wartość hasła (dla requirements check)
}
```

### 4.5. PasswordRequirements.tsx

**Opis:**
Komponent wyświetlający checklist wymagań hasła (dla formularza rejestracji).

**Główne elementy:**

- `<ul>` - lista wymagań
- `<li>` × N - poszczególne wymagania z ikonami Check/X
  - Min 6 znaków ✓/✗
  - (Opcjonalne przyszłe: wielka litera, cyfra, znak specjalny)

**Obsługiwane interakcje:**

- Brak (tylko wyświetlanie)

**Obsługiwana walidacja:**

- Brak (tylko visual feedback)

**Typy:**

- `PasswordRequirementsProps` - propsy komponentu

**Propsy:**

```typescript
interface PasswordRequirementsProps {
  password: string; // Aktualna wartość hasła do sprawdzenia
}
```

### 4.6. AuthErrorDisplay.tsx

**Opis:**
Komponent wyświetlający błędy autentykacji w przyjaznej formie.

**Główne elementy:**

- `<Alert variant="destructive">` - komponent Alert z Shadcn
- Ikona AlertCircle (Lucide)
- Tekst błędu

**Obsługiwane interakcje:**

- Opcjonalnie: dismiss button (X) do zamknięcia alertu

**Obsługiwana walidacja:**

- Brak

**Typy:**

- `AuthErrorDisplayProps` - propsy komponentu

**Propsy:**

```typescript
interface AuthErrorDisplayProps {
  error: string | null; // Komunikat błędu lub null
  onDismiss?: () => void; // Opcjonalny callback do zamknięcia
}
```

## 5. Typy

### 5.1. Typy formularzy

```typescript
// src/lib/types/auth.types.ts

/**
 * Dane formularza logowania
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Dane formularza rejestracji
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Dane formularza resetowania hasła
 */
export interface ResetPasswordFormData {
  email: string;
}

/**
 * Typ błędów autentykacji
 */
export type AuthErrorType =
  | "invalid_credentials"
  | "email_already_exists"
  | "weak_password"
  | "invalid_email"
  | "network_error"
  | "unknown_error";

/**
 * Obiekt błędu autentykacji
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
}

/**
 * Stan autentykacji
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Typ użytkownika z Supabase
 */
export type User = {
  id: string;
  email: string;
  created_at: string;
  // ... inne pola z Supabase Auth User type
};

/**
 * Typ sesji z Supabase
 */
export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
  // ... inne pola z Supabase Session type
};
```

### 5.2. Props komponentów

```typescript
export interface LoginFormProps {
  defaultEmail?: string;
  onSuccess?: () => void;
}

export interface RegisterFormProps {
  onSuccess?: () => void;
}

export interface ResetPasswordFormProps {
  defaultEmail?: string;
}

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showRequirements?: boolean;
  value?: string;
}

export interface PasswordRequirementsProps {
  password: string;
}

export interface AuthErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
}
```

## 6. Zarządzanie stanem

### 6.1. Authentication State (React Context)

**Custom Hook i Context: `useAuth`**

```typescript
// src/lib/hooks/useAuth.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/db/supabase.client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(mapSupabaseError(error));
    }

    // Redirect handled by onAuthStateChange
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(mapSupabaseError(error));
    }

    // Auto-login after signup (Supabase default behavior)
    // Redirect handled by onAuthStateChange
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error('Nie udało się wylogować');
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });

    if (error) {
      throw new Error(mapSupabaseError(error));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Helper function to map Supabase errors to user-friendly messages
function mapSupabaseError(error: any): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Nieprawidłowy email lub hasło';
    case 'User already registered':
      return 'Użytkownik o tym adresie email już istnieje';
    case 'Email not confirmed':
      return 'Email nie został potwierdzony';
    default:
      return 'Wystąpił błąd. Spróbuj ponownie później';
  }
}
```

### 6.2. Form State (React Hook Form)

Każdy formularz zarządza własnym stanem poprzez React Hook Form:

```typescript
// W LoginForm.tsx
const form = useForm<LoginFormData>({
  resolver: zodResolver(loginFormSchema),
  defaultValues: {
    email: props.defaultEmail || "",
    password: "",
  },
});

// W RegisterForm.tsx
const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerFormSchema),
  defaultValues: {
    email: "",
    password: "",
    confirmPassword: "",
  },
});
```

### 6.3. Local Component State (useState)

```typescript
// Stan dla password visibility toggle
const [showPassword, setShowPassword] = useState(false);

// Stan dla error display
const [error, setError] = useState<string | null>(null);

// Stan dla success message (reset password)
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

### 6.4. URL State

```typescript
// Tab selection z URL params
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get("tab") || "login";

// Pre-fill email z URL
const emailParam = searchParams.get("email") || undefined;

// Session expired reason
const sessionExpired = searchParams.get("reason") === "session_expired";
```

## 7. Integracja API (Supabase Auth)

### 7.1. Sign In (Login)

**Metoda Supabase:** `supabase.auth.signInWithPassword()`

**Request:**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: string,
  password: string,
});
```

**Response:**

- Success: `{ data: { user, session }, error: null }`
- Error: `{ data: null, error: AuthError }`

**Error Handling:**

- Invalid credentials → "Nieprawidłowy email lub hasło"
- Email not confirmed → "Email nie został potwierdzony"
- Network error → "Sprawdź połączenie internetowe"

**Post-Success Actions:**

1. Toast: "Zalogowano pomyślnie"
2. Redirect: `/dashboard?month={current}&year={current}`

### 7.2. Sign Up (Register)

**Metoda Supabase:** `supabase.auth.signUp()`

**Request:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email: string,
  password: string,
  options: {
    // Opcjonalnie: email redirect, metadata
  },
});
```

**Response:**

- Success: `{ data: { user, session }, error: null }`
- Error: `{ data: null, error: AuthError }`

**Error Handling:**

- Email already exists → "Użytkownik o tym adresie email już istnieje"
- Weak password → "Hasło jest zbyt słabe"
- Invalid email → "Nieprawidłowy format adresu email"

**Post-Success Actions:**

1. Database Trigger automatycznie tworzy:
   - User profile w tabeli `profiles`
   - Domyślne kategorie (jedzenie, opłaty, wynagrodzenie, przyjemności, Inne)
2. Auto-login (Supabase default)
3. Toast: "Konto utworzone pomyślnie! Witaj w Settlements 👋"
4. Redirect: `/dashboard?month={current}&year={current}`

### 7.3. Reset Password

**Metoda Supabase:** `supabase.auth.resetPasswordForEmail()`

**Request:**

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  email: string,
  {
    redirectTo: string, // URL do strony reset password confirm
  }
);
```

**Response:**

- Success: `{ error: null }` (email wysłany)
- Error: `{ error: AuthError }`

**Error Handling:**

- Invalid email → "Nieprawidłowy format adresu email"
- Network error → "Sprawdź połączenie internetowe"

**Post-Success Actions:**

1. Success message: "Link do resetowania hasła został wysłany na {email}"
2. Pozostanie na stronie reset-password (nie redirect)

### 7.4. Sign Out (Logout)

**Metoda Supabase:** `supabase.auth.signOut()`

**Request:**

```typescript
const { error } = await supabase.auth.signOut();
```

**Response:**

- Success: `{ error: null }`
- Error: `{ error: AuthError }`

**Post-Success Actions:**

1. Clear local state (handled by onAuthStateChange)
2. Toast: "Wylogowano pomyślnie"
3. Redirect: `/`

### 7.5. Session Management

**Auto-refresh token:**

- Supabase SDK automatycznie odświeża tokeny
- Sesja przechowywana w localStorage (Supabase default)

**Multi-tab synchronization:**

- onAuthStateChange listener w każdej karcie
- Broadcast channel communication (Supabase built-in)

**Session validation:**

```typescript
// W middleware/index.ts
const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  // Redirect to login
  return Response.redirect(new URL("/", request.url));
}
```

## 8. Interakcje użytkownika

### 8.1. Logowanie

**Happy path:**

1. Użytkownik wchodzi na `/`
2. Widzi formularz logowania (domyślna zakładka)
3. Wpisuje email
4. Wpisuje hasło
5. Klika "Zaloguj" (lub Enter)
6. Walidacja formularza (Zod)
7. Loading state na przycisku
8. Wywołanie `useAuth().signIn(email, password)`
9. Supabase Auth weryfikuje credentials
10. Po sukcesie: toast + redirect do `/dashboard`

**Error path:**

1. Kroki 1-8 jak wyżej
2. Supabase zwraca error (np. invalid credentials)
3. Wyświetlenie błędu pod formularzem: "Nieprawidłowy email lub hasło"
4. Focus na polu email
5. Użytkownik może poprawić i spróbować ponownie

**Keyboard navigation:**

- Tab: przejście między polami
- Enter w email → focus na password
- Enter w password → submit formularza
- Shift+Tab: wstecz

### 8.2. Rejestracja

**Happy path:**

1. Użytkownik klika zakładkę "Rejestracja"
2. Widzi formularz rejestracji (puste pola)
3. Wpisuje email
4. Wpisuje hasło (pokazuje się checklist wymagań)
5. Wpisuje potwierdzenie hasła
6. Real-time walidacja: hasła się zgadzają ✓
7. Klika "Zarejestruj"
8. Walidacja formularza
9. Loading state na przycisku
10. Wywołanie `useAuth().signUp(email, password)`
11. Supabase tworzy konto
12. Database trigger tworzy profil + domyślne kategorie
13. Auto-login
14. Toast: "Konto utworzone pomyślnie! Witaj w Settlements 👋"
15. Redirect do `/dashboard` (empty state - brak transakcji)
16. EmptyState zachęca: "Dodaj pierwszą transakcję"

**Error path - email zajęty:**

1. Kroki 1-10 jak wyżej
2. Supabase zwraca error: "User already registered"
3. Wyświetlenie błędu: "Użytkownik o tym adresie email już istnieje"
4. Sugestia: "Może chcesz się zalogować?"
5. Link do przełączenia na zakładkę logowania

**Error path - hasła nie pasują:**

1. Użytkownik wpisuje różne hasła
2. Real-time walidacja: komunikat przy confirmPassword: "Hasła muszą być identyczne"
3. Przycisk "Zarejestruj" disabled
4. Użytkownik poprawia hasło
5. Walidacja OK → przycisk enabled

### 8.3. Resetowanie hasła

**Flow:**

1. Użytkownik na stronie logowania
2. Klika link "Zapomniałem hasła"
3. Przekierowanie do `/reset-password`
4. Widzi formularz z polem email
5. Wpisuje email
6. Klika "Wyślij link resetujący"
7. Walidacja formularza
8. Loading state na przycisku
9. Wywołanie `useAuth().resetPasswordForEmail(email)`
10. Supabase wysyła email z linkiem
11. Success message: "Link do resetowania hasła został wysłany na {email}"
12. Informacja: "Sprawdź swoją skrzynkę email"
13. Link "Powrót do logowania" → `/`

**Email flow (poza aplikacją):**

1. Użytkownik otrzymuje email
2. Klika link w emailu
3. Przekierowanie do `/reset-password/confirm` (nowa strona, nie w MVP)
4. Formularz nowego hasła
5. Ustawienie nowego hasła
6. Redirect do logowania

### 8.4. Przełączanie zakładek

**Interakcja:**

1. Użytkownik na zakładce "Logowanie"
2. Klika zakładkę "Rejestracja"
3. URL aktualizuje się: `/?tab=register`
4. Smooth transition do formularza rejestracji
5. Focus na pierwszym polu (email)

**Keyboard:**

- Alt+1 → zakładka Logowanie (opcjonalne)
- Alt+2 → zakładka Rejestracja (opcjonalne)

### 8.5. Toggle password visibility

**Interakcja:**

1. Użytkownik wpisuje hasło (type="password", widzi •••)
2. Klika ikonę oka
3. Hasło staje się widoczne (type="text")
4. Ikona zmienia się na EyeOff
5. Klika ponownie → hasło ukryte

### 8.6. Session expired scenario

**Flow:**

1. Użytkownik pracuje w dashboardzie
2. Sesja wygasa (token expired, nie odświeżony)
3. Middleware wykrywa brak ważnej sesji
4. Redirect do `/?reason=session_expired`
5. Toast notification: "Sesja wygasła. Zaloguj się ponownie"
6. Formularz logowania z pre-filled email (jeśli możliwe)

## 9. Warunki i walidacja

### 9.1. Walidacja formularza logowania (Zod)

**Schema lokalizacja:** `src/lib/schemas/auth.schema.ts`

```typescript
export const loginFormSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email")
    .toLowerCase()
    .trim(),

  password: z.string({ required_error: "Hasło jest wymagane" }).min(6, "Hasło musi mieć minimum 6 znaków"),
});
```

**Komponenty dotknięte:** `LoginForm.tsx`

**Wpływ na UI:**

- Błędy wyświetlane pod polami w czerwonym kolorze
- Przycisk "Zaloguj" disabled gdy `!form.formState.isValid || isSubmitting`
- Focus na pierwszym polu z błędem po błędzie submitu

### 9.2. Walidacja formularza rejestracji (Zod)

```typescript
export const registerFormSchema = z
  .object({
    email: z
      .string({ required_error: "Email jest wymagany" })
      .email("Nieprawidłowy format adresu email")
      .toLowerCase()
      .trim(),

    password: z.string({ required_error: "Hasło jest wymagane" }).min(6, "Hasło musi mieć minimum 6 znaków"),
    // Opcjonalne dla przyszłości:
    // .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
    // .regex(/[0-9]/, 'Hasło musi zawierać cyfrę')
    // .regex(/[^A-Za-z0-9]/, 'Hasło musi zawierać znak specjalny'),

    confirmPassword: z.string({ required_error: "Potwierdzenie hasła jest wymagane" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });
```

**Komponenty dotknięte:** `RegisterForm.tsx`

**Real-time validation:**

- Password requirements checklist aktualizuje się podczas wpisywania
- Confirm password sprawdzany przy onBlur i onChange

### 9.3. Walidacja reset password (Zod)

```typescript
export const resetPasswordFormSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email")
    .toLowerCase()
    .trim(),
});
```

### 9.4. Warunki wyświetlania

**Session expired banner:**

- Pokazany gdy: `searchParams.get('reason') === 'session_expired'`
- Alert na górze strony: "Sesja wygasła. Zaloguj się ponownie"
- Variant: warning (żółty)

**Success message (reset password):**

- Pokazany po pomyślnym wysłaniu emaila
- Alert: "Link do resetowania hasła został wysłany na {email}"
- Variant: success (zielony)

**Error display:**

- Pokazany gdy: `error !== null`
- Alert: `{error.message}`
- Variant: destructive (czerwony)

**Loading state:**

- Przycisk submit: disabled + spinner gdy `isSubmitting === true`
- Opacity form fields: 0.6 podczas submitu (opcjonalne)

**Password requirements checklist:**

- Pokazany tylko w RegisterForm
- Pokazany gdy: focus na polu password LUB password.length > 0
- Każde wymaganie z ikoną:
  - ✓ zielona gdy spełnione
  - ✗ czerwona gdy niespełnione
  - szara gdy password puste

## 10. Obsługa błędów

### 10.1. Błędy Supabase Auth

**Mapping błędów do user-friendly messages:**

| Supabase Error              | User Message                                  | UI Action                  |
| --------------------------- | --------------------------------------------- | -------------------------- |
| `Invalid login credentials` | "Nieprawidłowy email lub hasło"               | Alert pod formularzem      |
| `User already registered`   | "Użytkownik o tym adresie email już istnieje" | Alert + sugestia logowania |
| `Email not confirmed`       | "Potwierdź swój adres email"                  | Alert z instrukcją         |
| `Invalid email`             | "Nieprawidłowy format adresu email"           | Błąd przy polu email       |
| `Weak password`             | "Hasło jest zbyt słabe"                       | Błąd przy polu password    |
| Network error               | "Sprawdź połączenie internetowe"              | Alert + retry button       |
| Unknown error               | "Wystąpił błąd. Spróbuj ponownie"             | Alert + support link       |

### 10.2. Błędy walidacji formularza

**Obsługa:**

- React Hook Form + Zod automatyczna walidacja
- Błędy wyświetlane w `<FormMessage>` pod polami
- Czerwone obramowanie pól z błędami (`border-red-500`)
- Ikona błędu przy polu (AlertCircle)

**Przykłady błędów:**

- Email puste: "Email jest wymagany"
- Email nieprawidłowy: "Nieprawidłowy format adresu email"
- Hasło za krótkie: "Hasło musi mieć minimum 6 znaków"
- Hasła nie pasują: "Hasła muszą być identyczne"

### 10.3. Błędy sieci

**Scenario 1: Offline**

1. Użytkownik offline podczas submitu
2. Fetch fail z network error
3. Catch error w try-catch
4. Alert: "Sprawdź połączenie internetowe"
5. Przycisk "Spróbuj ponownie" w alercie
6. Formularz pozostaje wypełniony

**Scenario 2: Timeout**

1. Request trwa bardzo długo
2. Opcjonalny timeout (np. 10s)
3. Cancel request + error message
4. "Operacja trwała zbyt długo. Spróbuj ponownie"

### 10.4. Rate limiting

**Supabase default rate limiting:**

- Zbyt wiele prób logowania z tego samego IP
- Supabase zwraca error: "Too many requests"
- UI: "Zbyt wiele prób. Spróbuj ponownie za chwilę"
- Opcjonalnie: countdown timer

### 10.5. Edge cases

**Email case sensitivity:**

- Zawsze convert do lowercase przed wysłaniem (`.toLowerCase()`)
- Zapobiega duplikatom: User@example.com vs user@example.com

**Whitespace handling:**

- Trim email przed wysłaniem (`.trim()`)
- Zapobiega błędom z spacjami

**Browser autofill:**

- Kompatybilność z password managers
- Odpowiednie atrybuty: `autocomplete="email"`, `autocomplete="current-password"`

**Back button behavior:**

- Po zalogowaniu użytkownik klika "wstecz"
- Middleware wykrywa że już zalogowany
- Redirect z powrotem do dashboard (nie pokazuje formularza)

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury

1.1. Utwórz katalogi:

```
src/components/auth/
src/lib/schemas/
```

1.2. Utwórz pliki stron:

```
src/pages/index.astro
src/pages/reset-password.astro
```

1.3. Utwórz layout:

```
src/layouts/AuthLayout.astro
```

### Krok 2: Supabase Client Setup

2.1. Sprawdź czy istnieje `src/db/supabase.client.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

2.2. Dodaj environment variables do `.env`:

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Krok 3: Typy

3.1. Utwórz `src/lib/types/auth.types.ts`:

- `LoginFormData`
- `RegisterFormData`
- `ResetPasswordFormData`
- `AuthError`
- `AuthState`

  3.2. Export z Supabase types:

```typescript
export type { User, Session } from "@supabase/supabase-js";
```

### Krok 4: Zod Schemas

4.1. Utwórz `src/lib/schemas/auth.schema.ts`:

- `loginFormSchema`
- `registerFormSchema`
- `resetPasswordFormSchema`

  4.2. Export schemas i type inference:

```typescript
export type LoginFormData = z.infer<typeof loginFormSchema>;
```

### Krok 5: Auth Context & Hook

5.1. Utwórz `src/lib/hooks/useAuth.tsx`:

- `AuthContext` creation
- `AuthProvider` component
- `useAuth` hook
- Methods: `signIn`, `signUp`, `signOut`, `resetPasswordForEmail`
- Error mapping helper function

  5.2. Dodaj AuthProvider do głównego layoutu:

```tsx
// src/layouts/Layout.astro lub App.tsx
<AuthProvider>
  <slot />
</AuthProvider>
```

### Krok 6: Utility Components

6.1. Utwórz `src/components/auth/PasswordInput.tsx`:

- Input z show/hide toggle
- Eye/EyeOff ikony (Lucide)
- Forward ref dla React Hook Form

  6.2. Utwórz `src/components/auth/PasswordRequirements.tsx`:

- Checklist wymagań hasła
- Dynamic check marks (✓/✗)
- Color coding (zielony/czerwony/szary)

  6.3. Utwórz `src/components/auth/AuthErrorDisplay.tsx`:

- Alert component (Shadcn)
- Error message display
- Optional dismiss button

### Krok 7: Login Form

7.1. Utwórz `src/components/auth/LoginForm.tsx`:

- Setup React Hook Form z loginFormSchema
- Email input field
- Password input field (używa PasswordInput)
- "Zapomniałem hasła" link
- Submit button z loading state
- Error display
- useAuth hook integration
- Submit handler z error handling
- Success redirect logic

### Krok 8: Register Form

8.1. Utwórz `src/components/auth/RegisterForm.tsx`:

- Setup React Hook Form z registerFormSchema
- Email input field
- Password input (z PasswordRequirements)
- Confirm password input
- Submit button z loading state
- Error display
- useAuth hook integration
- Submit handler
- Success redirect logic

### Krok 9: Reset Password Form

9.1. Utwórz `src/components/auth/ResetPasswordForm.tsx`:

- Setup React Hook Form z resetPasswordFormSchema
- Email input field
- Submit button
- Success message display
- "Powrót do logowania" link
- useAuth hook integration

### Krok 10: Auth Layout

10.1. Utwórz `src/layouts/AuthLayout.astro`:

- Centered layout design
- Logo/branding section
- Card container dla formularzy
- Dark theme styling
- Responsive (desktop-first)

  10.2. Dodaj server-side check:

```typescript
// Redirect jeśli już zalogowany
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/dashboard");
}
```

### Krok 11: Index Page (Login/Register)

11.1. Utwórz `src/pages/index.astro`:

- Użyj AuthLayout
- Server-side auth check (redirect jeśli zalogowany)
- Renderuj Tabs component z Shadcn
- TabsList z triggerami "Logowanie" i "Rejestracja"
- TabsContent dla każdej zakładki:
  - Login → `<LoginForm client:load />`
  - Register → `<RegisterForm client:load />`

  11.2. Obsługa URL params:

```typescript
const tab = Astro.url.searchParams.get("tab") || "login";
const reason = Astro.url.searchParams.get("reason");
```

11.3. Session expired banner (jeśli reason === 'session_expired')

### Krok 12: Reset Password Page

12.1. Utwórz `src/pages/reset-password.astro`:

- Użyj AuthLayout
- Renderuj `<ResetPasswordForm client:load />`
- Opcjonalnie pre-fill email z URL param

### Krok 13: Middleware Update

13.1. Zaktualizuj `src/middleware/index.ts`:

- Dodaj public paths: `['/']`, `['/reset-password']`
- Protected paths: wszystko inne
- Auth check dla protected routes:

```typescript
const {
  data: { session },
} = await context.locals.supabase.auth.getSession();

if (!session && !publicPaths.includes(url.pathname)) {
  return Response.redirect(new URL("/", url.origin));
}

if (session && publicPaths.includes(url.pathname)) {
  return Response.redirect(new URL("/dashboard", url.origin));
}
```

### Krok 14: Supabase Database Triggers

14.1. Sprawdź czy istnieje trigger tworzący profil:

```sql
-- W migrations/20251008120100_user_automation_triggers.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  -- Create default categories
  INSERT INTO public.categories (user_id, name, is_deletable)
  VALUES
    (NEW.id, 'Jedzenie', true),
    (NEW.id, 'Opłaty', true),
    (NEW.id, 'Wynagrodzenie', true),
    (NEW.id, 'Przyjemności', true),
    (NEW.id, 'Inne', false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Krok 15: Styling

15.1. Zainstaluj potrzebne komponenty Shadcn:

```bash
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add button
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
```

15.2. Dodaj custom styling w `src/styles/global.css`:

- Auth card styling (centered, max-width, padding)
- Dark theme variables
- Focus states
- Form field spacing
- Error message styling

  15.3. Tailwind classes dla auth components:

- Card: `max-w-md w-full mx-auto`
- Form spacing: `space-y-4`
- Button full width: `w-full`

### Krok 16: Toast Notifications

16.1. Setup Sonner (jeśli nie zrobione):

```bash
npm install sonner
```

16.2. Dodaj Toaster do AuthLayout:

```tsx
import { Toaster } from "sonner";

<Toaster theme="dark" position="top-right" />;
```

16.3. Użyj toasts w forms:

```typescript
import { toast } from "sonner";

// Success
toast.success("Zalogowano pomyślnie");

// Error
toast.error(error.message);
```

### Krok 17: Accessibility

17.1. Dodaj ARIA labels:

```tsx
<Input aria-label="Adres email" aria-required="true" aria-invalid={!!errors.email} aria-describedby="email-error" />
```

17.2. Dodaj ARIA live regions dla errors:

```tsx
<div role="alert" aria-live="polite">
  {error && <FormMessage>{error}</FormMessage>}
</div>
```

17.3. Focus management:

- Auto-focus na pierwszy input przy montowaniu
- Focus na błędnym polu po failed submit
- Focus trap w modalach (jeśli używane)

  17.4. Keyboard navigation:

- Tab order poprawny
- Enter submits form
- Escape zamyka modals/alerts

### Krok 18: Error Handling

18.1. Dodaj error boundary dla auth components:

```tsx
<ErrorBoundary fallback={<AuthErrorFallback />}>
  <LoginForm />
</ErrorBoundary>
```

18.2. Comprehensive try-catch w submit handlers:

```typescript
try {
  await signIn(data.email, data.password);
} catch (error) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError("Wystąpił nieoczekiwany błąd");
  }
}
```

### Krok 19: Testing

19.1. Unit tests dla schemas:

```typescript
// auth.schema.test.ts
describe("loginFormSchema", () => {
  it("validates correct email", () => {
    expect(
      loginFormSchema.parse({
        email: "test@example.com",
        password: "password123",
      })
    ).toBeTruthy();
  });

  it("rejects invalid email", () => {
    expect(() =>
      loginFormSchema.parse({
        email: "invalid-email",
        password: "password123",
      })
    ).toThrow();
  });
});
```

19.2. Component tests:

```typescript
// LoginForm.test.tsx
describe('LoginForm', () => {
  it('shows validation errors', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email jest wymagany/i)).toBeInTheDocument();
  });

  it('calls signIn on valid submit', async () => {
    const mockSignIn = vi.fn();
    // Mock useAuth hook

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/hasło/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /zaloguj/i }));

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

19.3. E2E tests:

```typescript
// auth.spec.ts (Playwright)
test("user can register and login", async ({ page }) => {
  // Register
  await page.goto("/");
  await page.click("text=Rejestracja");
  await page.fill('[name="email"]', "newuser@example.com");
  await page.fill('[name="password"]', "password123");
  await page.fill('[name="confirmPassword"]', "password123");
  await page.click('button:has-text("Zarejestruj")');

  // Should be redirected to dashboard
  await page.waitForURL("/dashboard");
  expect(page.url()).toContain("/dashboard");
});
```

### Krok 20: Security

20.1. CSP Headers (Content Security Policy):

```typescript
// W astro.config.mjs lub middleware
headers: {
  'Content-Security-Policy': "default-src 'self'; ..."
}
```

20.2. Rate limiting (Supabase side):

- Już obsługiwane przez Supabase
- Opcjonalnie: custom rate limiting w middleware

  20.3. Password security:

- Supabase haszuje hasła (bcrypt)
- Nigdy nie loguj haseł
- Hasła nigdy w URL params

  20.4. XSS Prevention:

- React automatycznie escapuje
- Używaj tylko zaufanych źródeł dla dangerouslySetInnerHTML (nie używaj)

### Krok 21: Performance Optimization

21.1. Code splitting:

```typescript
const LoginForm = lazy(() => import("./LoginForm"));
const RegisterForm = lazy(() => import("./RegisterForm"));
```

21.2. Prefetching:

- Prefetch dashboard route po successful login (opcjonalne)

  21.3. Bundle size:

- Używaj tylko potrzebnych ikon z Lucide
- Tree-shaking dla Supabase client

### Krok 22: Final Polish

22.1. Loading states:

- Skeleton dla formularza podczas initial load (opcjonalne)
- Spinner na przycisku podczas submitu
- Disabled state dla wszystkich inputów podczas submitu

  22.2. Transitions:

- Smooth tab switching
- Fade in/out dla error messages
- Page transitions (opcjonalne)

  22.3. Copy refinement:

- Sprawdź wszystkie komunikaty błędów
- Sprawdź labele i placeholdery
- Upewnij się że ton jest przyjazny

### Krok 23: Documentation

23.1. JSDoc comments dla wszystkich funkcji

23.2. README dla auth flow:

- Jak działa autentykacja
- Jak zintegrować nowe auth methods
- Troubleshooting

### Krok 24: Deployment Checklist

24.1. Environment variables na produkcji:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

  24.2. Supabase configuration:

- Email templates customization
- Redirect URLs whitelist
- Rate limiting settings

  24.3. Testing na produkcji:

- Test registration flow
- Test login flow
- Test password reset flow
- Test session persistence
- Test multi-tab sync

---

## Podsumowanie

Ten plan implementacji zapewnia kompletny przewodnik do stworzenia widoku Authentication w aplikacji Settlements. Kluczowe punkty:

- **Integracja z Supabase Auth**: Pełna obsługa signIn, signUp, signOut, resetPassword
- **Formularze**: React Hook Form + Zod dla validation
- **State Management**: React Context (AuthProvider) + local useState
- **UX**: Tab switching, password visibility toggle, friendly error messages
- **Security**: Proper password handling, XSS prevention, rate limiting
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Testing**: Unit, component, E2E tests

Po implementacji tego widoku użytkownicy będą mogli:

1. Zarejestrować nowe konto
2. Zalogować się do istniejącego konta
3. Zresetować zapomniane hasło
4. Być automatycznie przekierowani do Dashboard po sukcesie
5. Korzystać z trwałych sesji (persistent login)

Widok Auth stanowi fundament dla całej aplikacji i zapewnia bezpieczny, user-friendly flow uwierzytelniania.
