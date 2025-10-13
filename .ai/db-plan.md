### 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

#### Typy niestandardowe

- **`transaction_type` (ENUM)**
  - `income`
  - `expense`

---

#### Tabela: `profiles`
Przechowuje publiczne dane użytkowników, rozszerzając tabelę `auth.users`.

| Nazwa kolumny | Typ danych    | Ograniczenia                                               | Opis                                           |
|---------------|---------------|------------------------------------------------------------|------------------------------------------------|
| `id`          | `UUID`        | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Klucz główny, powiązany z użytkownikiem Supabase. |
| `updated_at`  | `TIMESTAMPTZ` | -                                                          | Data ostatniej aktualizacji profilu.           |

---

#### Tabela: `categories`
Przechowuje kategorie transakcji zdefiniowane przez użytkownika oraz domyślne.

| Nazwa kolumny  | Typ danych | Ograniczenia                                                         | Opis                                                               |
|----------------|------------|----------------------------------------------------------------------|--------------------------------------------------------------------|
| `id`           | `UUID`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                           | Unikalny identyfikator kategorii.                                  |
| `user_id`      | `UUID`     | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`              | Identyfikator użytkownika, do którego należy kategoria.            |
| `name`         | `TEXT`     | `NOT NULL`, `CHECK (char_length(name) <= 100)`                       | Nazwa kategorii.                                                   |
| `is_deletable` | `BOOLEAN`  | `NOT NULL`, `DEFAULT true`                                           | Flaga określająca, czy kategoria może być usunięta przez użytkownika. |
| `created_at`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                        | Data utworzenia kategorii.                                         |
| **Unikalność** |            | `UNIQUE (user_id, name)`                                             | Zapewnia, że nazwy kategorii są unikalne dla każdego użytkownika.    |

---

#### Tabela: `transactions`
Główna tabela przechowująca wszystkie transakcje finansowe użytkowników.

| Nazwa kolumny  | Typ danych         | Ograniczenia                                                              | Opis                                                                   |
|----------------|--------------------|---------------------------------------------------------------------------|------------------------------------------------------------------------|
| `id`           | `UUID`             | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                | Unikalny identyfikator transakcji.                                     |
| `user_id`      | `UUID`             | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                   | Identyfikator użytkownika, do którego należy transakcja.               |
| `category_id`  | `UUID`             | `REFERENCES public.categories(id) ON DELETE SET NULL`                       | Identyfikator powiązanej kategorii. `ON DELETE SET NULL` jest celowe, ponieważ trigger przejmie logikę przepinania do kategorii "Inne". |
| `amount`       | `NUMERIC(10, 2)`   | `NOT NULL`, `CHECK (amount > 0)`                                          | Kwota transakcji.                                                      |
| `type`         | `transaction_type` | `NOT NULL`                                                                | Typ transakcji ('income' lub 'expense').                                 |
| `date`         | `DATE`             | `NOT NULL`                                                                | Data transakcji.                                                       |
| `note`         | `TEXT`             | `CHECK (char_length(note) <= 500)`                                        | Opcjonalna notatka do transakcji.                                      |
| `created_at`   | `TIMESTAMPTZ`      | `NOT NULL`, `DEFAULT now()`                                               | Data utworzenia rekordu transakcji.                                    |

---

### 2. Relacje między tabelami

- **`auth.users` <-> `profiles`** (Jeden-do-jednego)
  - Każdy użytkownik w `auth.users` ma dokładnie jeden profil w `profiles`. Relacja jest wymuszona przez `PRIMARY KEY` tabeli `profiles`, który jest jednocześnie `FOREIGN KEY` do `auth.users`.

- **`auth.users` <-> `categories`** (Jeden-do-wielu)
  - Każdy użytkownik może mieć wiele kategorii, ale każda kategoria należy tylko do jednego użytkownika.

- **`auth.users` <-> `transactions`** (Jeden-do-wielu)
  - Każdy użytkownik może mieć wiele transakcji, ale każda transakcja należy tylko do jednego użytkownika.

- **`categories` <-> `transactions`** (Jeden-do-wielu)
  - Każda kategoria może być przypisana do wielu transakcji, ale każda transakcja ma przypisaną tylko jedną kategorię.

---

### 3. Indeksy

- **`transactions(user_id, date DESC)`**: Kluczowy złożony indeks do optymalizacji głównego widoku pulpitu, który filtruje i sortuje transakcje według użytkownika i daty.
- **`categories(user_id)`**: Indeks na kluczu obcym w tabeli `categories` w celu przyspieszenia zapytań filtrujących kategorie dla danego użytkownika.
- **`transactions(user_id)`**: Indeks na kluczu obcym w tabeli `transactions`.
- **`transactions(category_id)`**: Indeks na kluczu obcym w tabeli `transactions`.

---

### 4. Zasady PostgreSQL (Row-Level Security)

**Wymagane jest włączenie RLS dla wszystkich poniższych tabel.**

- **Tabela `profiles`**:
  - `SELECT`: Użytkownik może odczytać tylko własny profil. `auth.uid() = id`
  - `INSERT`: Użytkownik może utworzyć tylko własny profil. `auth.uid() = id`
  - `UPDATE`: Użytkownik może zaktualizować tylko własny profil. `auth.uid() = id`

- **Tabela `categories`**:
  - `SELECT`: Użytkownik może odczytać tylko własne kategorie. `auth.uid() = user_id`
  - `INSERT`: Użytkownik może dodawać kategorie tylko dla siebie. `auth.uid() = user_id`
  - `UPDATE`: Użytkownik może modyfikować tylko własne kategorie. `auth.uid() = user_id`
  - `DELETE`: Użytkownik może usuwać tylko własne kategorie, które mają flagę `is_deletable = true`. `auth.uid() = user_id AND is_deletable = true`

- **Tabela `transactions`**:
  - `SELECT`: Użytkownik może odczytać tylko własne transakcje. `auth.uid() = user_id`
  - `INSERT`: Użytkownik może dodawać transakcje tylko dla siebie. `auth.uid() = user_id`
  - `UPDATE`: Użytkownik może modyfikować tylko własne transakcje. `auth.uid() = user_id`
  - `DELETE`: Użytkownik może usuwać tylko własne transakcje. `auth.uid() = user_id`

---

### 5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych

1.  **Automatyzacja za pomocą Triggerów**:
    - **Tworzenie profilu**: Trigger na `auth.users` po operacji `INSERT` powinien automatycznie tworzyć powiązany rekord w tabeli `profiles`.
    - **Tworzenie domyślnych kategorii**: Ten sam trigger (`AFTER INSERT ON auth.users`) powinien wywołać funkcję, która doda domyślny zestaw kategorii (`Food`, `Bills`, `Salary`, `Entertainment`) oraz jedną systemową, nieusuwalną kategorię `Other` (`is_deletable = false`) dla nowego użytkownika.
    - **Bezpieczne usuwanie kategorii**: Trigger `BEFORE DELETE` na tabeli `categories` jest niezbędny. Przed usunięciem kategorii, trigger musi zidentyfikować kategorię "Other" (`is_deletable = false`) należącą do tego samego użytkownika i zaktualizować `category_id` we wszystkich powiązanych transakcjach na ID tej kategorii "Other".

2.  **Integralność danych**:
    - Użycie typu `ENUM` dla `transaction_type` gwarantuje, że do bazy trafią tylko dozwolone wartości.
    - Ograniczenie `CHECK` na kwocie (`amount > 0`) zapewnia, że wszystkie transakcje będą miały dodatnie wartości.
    - Użycie typu `NUMERIC(10, 2)` jest kluczowe dla precyzyjnego przechowywania wartości pieniężnych.

3.  **Kaskadowe usuwanie**:
    - Użycie `ON DELETE CASCADE` w relacjach z `auth.users` zapewnia, że po usunięciu konta użytkownika, wszystkie jego dane (profil, kategorie, transakcje) zostaną automatycznie i spójnie usunięte z bazy danych, co jest zgodne z wymaganiami PRD (US-005).
