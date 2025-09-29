# Dokument wymagań produktu (PRD) - Settlements

## 1. Przegląd produktu

Aplikacja "Settlements" to webowa aplikacja typu MVP (Minimum Viable Product), której celem jest umożliwienie użytkownikom prostego i efektywnego zarządzania budżetem domowym. Aplikacja pozwala na manualne rejestrowanie miesięcznych przychodów i wydatków, ich kategoryzację oraz wizualizację w celu lepszego zrozumienia własnej sytuacji finansowej. Grupą docelową są osoby fizyczne, które poszukują intuicyjnego narzędzia do śledzenia swoich finansów bez zaawansowanych i skomplikowanych funkcji. Całość oparta jest o platformę Supabase, a interfejs użytkownika jest zaprojektowany w ciemnym motywie, z myślą o użytkowaniu na komputerach stacjonarnych.

## 2. Problem użytkownika

Wiele osób ma trudności z bieżącym śledzeniem swoich miesięcznych przychodów i wydatków, co prowadzi do braku kontroli nad domowym budżetem. Istniejące rozwiązania są często zbyt skomplikowane, wymagają integracji z kontami bankowymi lub posiadają nadmiar funkcji, które nie są potrzebne do podstawowego zarządzania finansami. Użytkownicy potrzebują prostego, szybkiego i dedykowanego narzędzia, które pozwoli im ręcznie wprowadzać transakcje, kategoryzować je i na tej podstawie analizować swoje finanse za pomocą czytelnych podsumowań i wizualizacji. Brak takiego narzędzia skutkuje poleganiem na arkuszach kalkulacyjnych, notatkach lub całkowitym zaniechaniem śledzenia wydatków.

## 3. Wymagania funkcjonalne

### 3.1. Uwierzytelnianie i Zarządzanie Kontem
- Rejestracja nowego użytkownika (email/hasło).
- Logowanie do aplikacji.
- Możliwość zresetowania zapomnianego hasła.
- Możliwość usunięcia konta przez użytkownika w ustawieniach (zabezpieczone hasłem).
- Obsługa sesji użytkownika (utrzymywanie zalogowania).

### 3.2. Pulpit Główny (Dashboard)
- Domyślny widok pulpitu prezentuje dane finansowe dla bieżącego miesiąca.
- Nawigacja umożliwiająca zmianę wyświetlanego miesiąca (poprzedni/następny) oraz roku (lista rozwijana).
- Widoczne karty podsumowujące: "Przychody", "Wydatki", "Bilans". Karta "Bilans" dynamicznie zmienia kolor (zielony dla dodatniego, czerwony dla ujemnego).
- Wykres słupkowy wizualizujący sumę przychodów i wydatków dla każdego dnia w widoku miesięcznym.
- Lista wszystkich transakcji (przychody i wydatki) dla wybranego okresu, posortowana chronologicznie od najnowszych.
- Implementacja "infinite scroll" dla listy transakcji.
- Wyświetlanie komunikatów dla "pustych stanów" (np. brak transakcji w danym miesiącu).

### 3.3. Zarządzanie Transakcjami
- Możliwość dodania nowej transakcji poprzez modal.
- Formularz dodawania/edycji transakcji zawiera pola: kwota, data, kategoria, typ (przychód/wydatek), opcjonalna notatka.
- Walidacja formularza (np. kwota musi być liczbą dodatnią).
- Możliwość edycji istniejącej transakcji (w tym samym modalu, z wypełnionymi danymi).
- Możliwość usunięcia transakcji (z oknem dialogowym potwierdzenia).
- Wyświetlanie notatki do transakcji jako tooltip po najechaniu na ikonę.

### 3.4. Zarządzanie Kategoriami
- Dedykowana sekcja "Ustawienia" do zarządzania kategoriami.
- Nowi użytkownicy otrzymują domyślny zestaw kategorii: "jedzenie", "opłaty", "wynagrodzenie", "przyjemności".
- Użytkownik może dodawać, edytować i usuwać własne kategorie.
- Istnieje systemowa, nieusuwalna kategoria "Inne".
- Po usunięciu kategorii, wszystkie powiązane z nią transakcje są automatycznie przypisywane do kategorii "Inne".

### 3.5. Interfejs i Doświadczenie Użytkownika (UI/UX)
- Aplikacja działa wyłącznie w ciemnym motywie (dark mode).
- Interfejs jest zaprojektowany dla komputerów stacjonarnych (brak responsywności).
- Prosty nagłówek z nawigacją do Pulpitu, Ustawień oraz przyciskiem wylogowania.
- System powiadomień typu "toast" informujących o sukcesie operacji (np. "Transakcja dodana pomyślnie").
- Wskaźniki ładowania ("spinners") podczas operacji asynchronicznych (pobieranie danych).
- Komunikaty o błędach walidacji wyświetlane przy odpowiednich polach formularza.

### 3.6. Wymagania Techniczne
- Backend i baza danych w pełni oparte na Supabase.
- Waluta: PLN (zł), formatowanie kwot z separatorem tysięcznym i dwoma miejscami po przecinku (np. 1 234,56 zł).
- Format daty: DD.MM.RRRR.

## 4. Granice produktu (Co NIE wchodzi w zakres MVP)

- Aplikacje mobilne i responsywny design dla urządzeń mobilnych.
- Obsługa wielu walut.
- Funkcje importu/eksportu danych (np. z/do CSV).
- Zaawansowane raportowanie, filtrowanie i wyszukiwanie transakcji.
- Proces onboardingu lub samouczek dla nowych użytkowników.
- Możliwość wykonywania operacji masowych (np. masowe usuwanie transakcji).
- Interaktywne wykresy z zaawansowanymi opcjami (np. drill-down).

## 5. Historyjki użytkowników

### Uwierzytelnianie

- ID: US-001
- Tytuł: Rejestracja nowego konta
- Opis: Jako nowy użytkownik, chcę móc zarejestrować się w aplikacji za pomocą adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
    - Formularz rejestracji zawiera pola: adres e-mail, hasło, powtórz hasło.
    - Walidacja sprawdza poprawność formatu e-maila i czy hasła są identyczne.
    - Po pomyślnej rejestracji jestem automatycznie logowany i przekierowywany do pulpitu.
    - W przypadku błędu (np. zajęty e-mail) wyświetlany jest stosowny komunikat.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła.
- Kryteria akceptacji:
    - Formularz logowania zawiera pola: adres e-mail, hasło.
    - Po poprawnym zalogowaniu jestem przekierowywany do pulpitu.
    - W przypadku błędnych danych logowania wyświetlany jest stosowny komunikat.

- ID: US-003
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zakończyć swoją sesję.
- Kryteria akceptacji:
    - W nagłówku aplikacji znajduje się przycisk "Wyloguj".
    - Po kliknięciu przycisku moja sesja zostaje zakończona i jestem przekierowany na stronę logowania.

- ID: US-004
- Tytuł: Resetowanie hasła
- Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby odzyskać dostęp do konta.
- Kryteria akceptacji:
    - Na stronie logowania znajduje się link "Zapomniałem hasła".
    - Po podaniu adresu e-mail otrzymuję instrukcję resetowania hasła (obsługiwane przez Supabase).

- ID: US-005
- Tytuł: Usunięcie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia swojego konta i wszystkich powiązanych z nim danych.
- Kryteria akceptacji:
    - W ustawieniach konta znajduje się opcja usunięcia konta.
    - Usunięcie konta wymaga potwierdzenia przez podanie aktualnego hasła.
    - Po potwierdzeniu moje konto i wszystkie dane (transakcje, kategorie) są trwale usuwane.

### Pulpit i Nawigacja

- ID: US-006
- Tytuł: Wyświetlanie pulpitu
- Opis: Jako zalogowany użytkownik, po wejściu do aplikacji chcę widzieć pulpit z podsumowaniem finansowym dla bieżącego miesiąca.
- Kryteria akceptacji:
    - Pulpit jest domyślnym widokiem po zalogowaniu.
    - Wyświetlane są dane dla aktualnego miesiąca i roku.
    - Widoczne są karty: "Przychody", "Wydatki", "Bilans".
    - Widoczny jest wykres słupkowy i lista transakcji dla bieżącego miesiąca.

- ID: US-007
- Tytuł: Zmiana miesiąca
- Opis: Jako użytkownik, chcę móc przełączać widok pulpitu na poprzedni lub następny miesiąc.
- Kryteria akceptacji:
    - Na pulpicie znajdują się strzałki do nawigacji między miesiącami.
    - Kliknięcie strzałki "wstecz" ładuje dane dla poprzedniego miesiąca.
    - Kliknięcie strzałki "dalej" ładuje dane dla następnego miesiąca.
    - Wszystkie elementy pulpitu (karty, wykres, lista) aktualizują się, aby odzwierciedlić dane z wybranego miesiąca.

- ID: US-008
- Tytuł: Zmiana roku
- Opis: Jako użytkownik, chcę móc zmienić rok, dla którego wyświetlane są dane.
- Kryteria akceptacji:
    - Na pulpicie znajduje się lista rozwijana z dostępnymi latami.
    - Zmiana roku na liście powoduje załadowanie danych dla stycznia wybranego roku.
    - Wszystkie elementy pulpitu aktualizują się, aby odzwierciedlić dane z wybranego okresu.

- ID: US-009
- Tytuł: Podgląd podsumowania finansowego
- Opis: Jako użytkownik, chcę widzieć na pulpicie jasne podsumowanie moich przychodów, wydatków i bilansu dla wybranego okresu.
- Kryteria akceptacji:
    - Karta "Przychody" pokazuje sumę wszystkich przychodów w danym miesiącu.
    - Karta "Wydatki" pokazuje sumę wszystkich wydatków w danym miesiącu.
    - Karta "Bilans" pokazuje różnicę między przychodami a wydatkami.
    - Karta "Bilans" ma zielony kolor, gdy bilans jest dodatni lub zerowy, i czerwony, gdy jest ujemny.

- ID: US-010
- Tytuł: Wizualizacja transakcji na wykresie
- Opis: Jako użytkownik, chcę widzieć wykres słupkowy, który pokazuje sumę przychodów i wydatków dla każdego dnia w wybranym miesiącu.
- Kryteria akceptacji:
    - Wykres przedstawia dni miesiąca na osi X.
    - Dla każdego dnia z transakcjami wyświetlane są dwa słupki: jeden dla sumy przychodów, drugi dla sumy wydatków.
    - Dni bez transakcji nie mają słupków.
    - Wykres aktualizuje się po zmianie miesiąca/roku.

### Zarządzanie Transakcjami

- ID: US-011
- Tytuł: Dodawanie nowej transakcji
- Opis: Jako użytkownik, chcę móc szybko dodać nowy przychód lub wydatek.
- Kryteria akceptacji:
    - Na pulpicie znajduje się przycisk "+", który otwiera modal do dodawania transakcji.
    - Formularz w modalu zawiera pola: kwota, data (z kalendarzem ograniczonym do wybranego miesiąca), kategoria (lista rozwijana), typ (przychód/wydatek) i opcjonalna notatka.
    - Pole kwoty akceptuje tylko dodatnie wartości liczbowe.
    - Po pomyślnym dodaniu transakcji, jest ona widoczna na liście, a dane na pulpicie się aktualizują.
    - Otrzymuję powiadomienie "toast" o pomyślnym dodaniu transakcji.

- ID: US-012
- Tytuł: Wyświetlanie listy transakcji
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich transakcji dla wybranego okresu, posortowaną od najnowszej.
- Kryteria akceptacji:
    - Lista transakcji jest wyświetlana pod wykresem na pulpicie.
    - Każdy element listy pokazuje co najmniej: datę, nazwę kategorii, kwotę i typ transakcji.
    - Transakcje są posortowane malejąco według daty.
    - Gdy lista jest długa, nowe transakcje są doładowywane automatycznie podczas przewijania (infinite scroll).

- ID: US-013
- Tytuł: Edycja transakcji
- Opis: Jako użytkownik, chcę mieć możliwość edycji wcześniej dodanej transakcji, aby poprawić ewentualne błędy.
- Kryteria akceptacji:
    - Każda transakcja na liście ma opcję "Edytuj".
    - Kliknięcie "Edytuj" otwiera ten sam modal co przy dodawaniu, ale z wypełnionymi danymi transakcji.
    - Po zapisaniu zmian, lista transakcji i dane na pulpicie są aktualizowane.
    - Otrzymuję powiadomienie "toast" o pomyślnej edycji.

- ID: US-014
- Tytuł: Usuwanie transakcji
- Opis: Jako użytkownik, chcę mieć możliwość usunięcia transakcji, której już nie potrzebuję.
- Kryteria akceptacji:
    - Każda transakcja na liście ma opcję "Usuń".
    - Kliknięcie "Usuń" wyświetla okno dialogowe z prośbą o potwierdzenie.
    - Po potwierdzeniu transakcja jest usuwana, a lista i dane na pulpicie są aktualizowane.
    - Otrzymuję powiadomienie "toast" o pomyślnym usunięciu.

- ID: US-015
- Tytuł: Podgląd notatki do transakcji
- Opis: Jako użytkownik, chcę móc zobaczyć notatkę dodaną do transakcji, jeśli taka istnieje.
- Kryteria akceptacji:
    - Jeśli transakcja ma notatkę, na liście obok niej widoczna jest ikona.
    - Najazd myszką na ikonę wyświetla tooltip z treścią notatki.

- ID: US-016
- Tytuł: Obsługa pustego stanu
- Opis: Jako nowy użytkownik lub użytkownik przeglądający miesiąc bez transakcji, chcę zobaczyć informację o braku danych.
- Kryteria akceptacji:
    - Gdy w danym okresie nie ma żadnych transakcji, zamiast listy i wykresu wyświetlany jest komunikat, np. "Nie masz jeszcze żadnych transakcji w tym miesiącu. Dodaj pierwszą!".
    - Komunikat może zawierać przycisk wzywający do działania (dodania transakcji).

### Zarządzanie Kategoriami

- ID: US-017
- Tytuł: Zarządzanie kategoriami
- Opis: Jako użytkownik, chcę mieć dostęp do ustawień, gdzie mogę zarządzać moimi kategoriami wydatków i przychodów.
- Kryteria akceptacji:
    - W nagłówku aplikacji znajduje się link do strony "Ustawienia".
    - Na stronie ustawień widoczna jest lista moich kategorii.

- ID: US-018
- Tytuł: Dodawanie nowej kategorii
- Opis: Jako użytkownik, chcę móc dodawać własne kategorie, aby lepiej pasowały do moich potrzeb.
- Kryteria akceptacji:
    - W ustawieniach znajduje się formularz lub przycisk do dodawania nowej kategorii.
    - Po dodaniu nowa kategoria pojawia się na liście moich kategorii i jest dostępna do wyboru podczas dodawania/edycji transakcji.

- ID: US-019
- Tytuł: Edycja nazwy kategorii
- Opis: Jako użytkownik, chcę móc edytować nazwę istniejącej kategorii.
- Kryteria akceptacji:
    - Każda kategoria na liście (oprócz "Inne") ma opcję edycji.
    - Po zapisaniu nowej nazwy, jest ona zaktualizowana we wszystkich miejscach w aplikacji, w tym na liście transakcji.
    - Systemowa kategoria "Inne" nie może być edytowana.

- ID: US-020
- Tytuł: Usuwanie kategorii
- Opis: Jako użytkownik, chcę móc usunąć kategorię, której już nie używam.
- Kryteria akceptacji:
    - Każda kategoria na liście (oprócz "Inne") ma opcję usunięcia.
    - Usunięcie wymaga potwierdzenia.
    - Po usunięciu kategorii, wszystkie transakcje do niej przypisane są automatycznie przypisywane do kategorii "Inne".
    - Systemowa kategoria "Inne" nie może być usunięta.

### Informacje zwrotne dla użytkownika

- ID: US-021
- Tytuł: Otrzymywanie powiadomień o stanie operacji
- Opis: Jako użytkownik, chcę otrzymywać wizualne potwierdzenie, że moje akcje (dodanie, edycja, usunięcie) zakończyły się sukcesem.
- Kryteria akceptacji:
    - Po pomyślnym dodaniu, edycji lub usunięciu transakcji/kategorii na ekranie pojawia się krótkotrwałe powiadomienie typu "toast".

- ID: US-022
- Tytuł: Widoczność stanu ładowania danych
- Opis: Jako użytkownik, chcę wiedzieć, kiedy aplikacja pobiera dane, aby uniknąć niepewności.
- Kryteria akceptacji:
    - Podczas ładowania danych (np. po zmianie miesiąca) na pulpicie wyświetlany jest wskaźnik ładowania ("spinner").

- ID: US-023
- Tytuł: Otrzymywanie informacji o błędach walidacji
- Opis: Jako użytkownik, podczas wypełniania formularzy chcę od razu wiedzieć, jeśli któreś pole wypełniłem niepoprawnie.
- Kryteria akceptacji:
    - Jeśli pole formularza (np. kwota) zostanie wypełnione niepoprawnie, pod polem wyświetlany jest komunikat o błędzie.
    - Przycisk zapisu jest nieaktywny, dopóki wszystkie błędy walidacji nie zostaną poprawione.

## 6. Metryki sukcesu

- Zakończenie kluczowych zadań: Wysoki wskaźnik pomyślnego dodawania, edytowania i usuwania transakcji.
- Aktywność użytkowników: Liczba transakcji dodawanych przez aktywnego użytkownika tygodniowo/miesięcznie.
- Retencja użytkowników: Procent użytkowników powracających do aplikacji po pierwszym tygodniu i pierwszym miesiącu od rejestracji.
- Satysfakcja użytkownika (jakościowa): Zbieranie opinii od pierwszych użytkowników na temat łatwości obsługi i przydatności aplikacji.
