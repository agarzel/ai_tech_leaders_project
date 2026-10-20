# Test design systemu agentem – lekcja 6

Data: 2026-10-20. Ekran testowy: **„Cancel booking”** dla mentee (backlog #34, reguła R04). Przypadki: anulowanie > 12 h przed sesją oznacza pełny zwrot; < 12 h oznacza brak zwrotu i zapłatę dla mentora; sesja rozpoczęta lub zakończona oznacza, że anulować nie można.

Agent pracował w świeżej sesji (Sonnet), bez dostępu do `POSTEP.md`, `.ai/runs/` i `lekcja-06/`. Korzystał tylko z dokumentacji design systemu: `.ai/docs/design-system.md`, stron `Design system/*` w Storybooku, AGENTS.md i kodu `packages/ui`.

Zbudowany ekran (`CancelBookingAction.tsx` i jego stories) był wyłącznie materiałem testowym. Nie trafił do repozytorium, bo E03 nie ma specyfikacji, a komponent nie ma testów jednostkowych.

## Wynik

| Kategoria | Liczba | Udział |
|---|---|---|
| REGUŁA (odpowiedź zapisana jako zasada) | 28 | 49% |
| PRZYKŁAD (tylko wzór w kodzie lub stories) | 11 | 19% |
| ZGADUJĘ (brak zasady i przykładu) | 18 | 32% |
| **Razem decyzji** | **57** | |

Dla porównania: w teście z nagrania kursu („Ulubieni mentorzy”) wyszło 19 / 14 / 27 z 60, czyli 45% zgadywania. U nas zgadywania jest 32%, a reguł 49% (w kursie 32%).

`lint:tokens` i `typecheck` przeszły; zbudowany ekran nie miał żadnej wartości spoza tokenów.

## Luki (20) i jak je zamykamy

### A. Luki produktowe, czyli brak specyfikacji E03 → „What is missing”

Design system nie może ich rozstrzygnąć. Rozstrzygnie je specyfikacja E03 (#33–#36).

| # | Luka | Co zgadł agent |
|---|---|---|
| 3 | Brak statusu „cancelled” w maszynie stanów rezerwacji, jego brzmienia dla mentee i mentora oraz odznaki; czy mentor widzi „zapłacono” | „Cancelled — refund on its way” / „Cancelled — no refund” |
| 4 | Brak kontraktu API anulowania | `POST /api/bookings/:id/cancel` → `{ refund: "full" \| "none" }`, odmowa 409 |
| 5 | Próg 12 h mija, gdy dialog jest otwarty | brak przeliczenia; decyduje serwer |
| 6 | Co strona robi po odmowie serwera („sesja już się zaczęła”) | komunikat w dialogu, bez odświeżenia rezerwacji |
| 7 | Definicja „sesja zakończona” | `startsAt + lengthMinutes` |
| 14 | Kto dostarcza próg bezpłatnego anulowania | liczony w kliencie tylko do podglądu; propozycja: `freeCancellationUntil` w `BookingDto`, jak `acceptBy` |
| 16 | Niespójny status #34 („not built” w jednym pliku, „pattern applies” w drugim) | — |

### B. Luki w design systemie → nowe zasady (propozycje do decyzji właściciela)

| # | Luka | Proponowana zasada |
|---|---|---|
| 1 | Brak wzorca „wynik akcji” | **Action result:** po sukcesie sekcja akcji zostaje zastąpiona zdaniem w `role="status"`, a fokus przechodzi na nagłówek sekcji (`tabIndex=-1`); strona odświeża dane, gdy ma je od serwera |
| 2 | Brak wzorca „akcja destrukcyjna na stronie” | **Page-level destructive action:** `h2` z nazwą akcji, jedno zdanie skutku, wyzwalacz; sekcja pod szczegółami obiektu, nie w panelu statusu |
| 8 | Wariant przycisku wyzwalacza | wyzwalacz na stronie to `outline` w rozmiarze default; kolor `destructive` ma tylko przycisk potwierdzający w dialogu |
| 9 | Akcent, gdy jedyną akcją jest akcja destrukcyjna | akcja destrukcyjna nigdy nie dostaje akcentu; ekran może nie mieć akcentu wcale |
| 10 | Skutek finansowy: `Alert` czy zdanie | zdanie w `type-body`; zaczyna się od słowa skutku („Full refund:” / „No refund:”), żeby nie zależeć od koloru; `Alert` tylko dla informacji, która przyszła z serwera lub zmienia się w czasie |
| 11 | Ten sam napis na wyzwalaczu i potwierdzeniu | wyzwalacz: „Cancel booking”; potwierdzenie: „Yes, cancel booking”; bezpieczny wybór: „Keep booking” |
| 12 | Co powtarzać w dialogu | tytuł nazywa obiekt (termin), opis powtarza zdanie skutku i kwotę; bez powtarzania całego podsumowania |
| 13 | `AcceptDeadline` ma na sztywno słowo „Decide” | ogólny wzorzec terminu z czasownikiem jako parametrem (np. „Free cancellation until … · in 8 h”); po terminie bez czasu względnego |
| 15 | AlertDialog na 320 px | przyciski jeden pod drugim, bezpieczny pierwszy; zapisane w dokumentacji AlertDialog |
| 18 | `role="alert"` kontra `role="status"` opisane tylko w komentarzu w kodzie | przenieść do dokumentacji Alert i Usage and accessibility |
| 19 | Gdzie leży story ekranu połączonego z komponentem | komponent: `stories/product/<Epic>/<Name>.stories.tsx`; ekran pełnostronicowy: `…/screens/` |
| 20 | `a11y: { context: "body" }` dla stories z otwartym dialogiem | obowiązkowe dla stories z otwartym `Dialog` / `AlertDialog` (portal poza story) |
| 17 | Brak wiersza w tabeli komponentów | dotyczy dopiero zbudowanego komponentu; uzupełnić przy implementacji E03 |

## Kryterium zaliczenia z lekcji

> Po teście agentem w nowej sesji każde miejsce, w którym agent zgadywał, ma zasadę w dokumentacji albo wpis w „What is missing”.

Każda luka z sekcji A ma wpis w „What is missing”, a każda z sekcji B dostaje zasadę.
