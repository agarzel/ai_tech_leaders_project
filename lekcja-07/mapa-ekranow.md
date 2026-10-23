# Mapa ekranów: Epik 01 (konta, zaproszenia, oferta mentora)

Status: DO ZATWIERDZENIA. Niczego nie zbudowano. Identyfikatory ekranów (s01–s12), scenariuszy (c01–c22) i luk (L01–L16, G01–G07) są trwałe: do nich przypinamy komentarze, więc po zatwierdzeniu ich nie zmieniamy ani nie przenumerowujemy.

Zakres: przepływ Epiku 01 ze specyfikacji `.ai/specs/2026-10-19-mentor-accounts-and-offer.md` (rejestracja mentee, logowanie, rejestracja mentora z zaproszenia, panel zaproszeń admina, strona startowa każdej roli, brak dostępu, profil i ceny, sloty, link do udostępniania, lista publiczna z opt-in). Rezerwacje i płatności (E02, #29–#32) są poza zakresem; pojawiają się tylko tam, gdzie dotykają ekranów E01 (zob. L05). Weryfikacji e-maila nie ma w 1.0, więc nie jest ekranem ani wymaganiem (jedno pytanie: L01).

Źródła: spec (rozdziały API Contracts, UI/UX, Edge Cases), `.ai/specs/product-brief.md` (R01–R08, D01–D16, N01–N03), issues GitHub #25, #26, #27, #28 (przeczytane `gh issue view`), `.ai/specs/backlog.md`, wywiady w `.ai/specs/research/`, design system (`.ai/docs/design-system.md`, `packages/ui/stories/design-system/WhatIsMissing.mdx`, `packages/ui/stories/product/E01/Screens.mdx`). Osobnych plików z personami w `research/` nie ma, są tylko wywiady; używam ich jako źródła zachowań.

---

## 0. Historie i kryteria akceptacji, z numerami

Numery z backlogu (`.ai/specs/backlog.md`, zgodne z GitHubem): epik E01 = #21; E01-S01 = #25 (ceny); E01-S01-T01 = #26 (konta, "zadanie" pod #25, nie osobna historia); E01-S02 = #27 (sloty); E01-S03 = #28 (link i lista). Kolejność zależności: #26 → #25 → #27 → #28. Etykiety `feature`, `priority-medium`, `risk-high` potwierdziłem w treści #25 i #26; etykiet #27 i #28 nie sprawdzałem.

### Kryteria z issues GitHub (cytowane skrótem)

| Id | Źródło | Kryterium |
|---|---|---|
| #26-a | #26 "Done when" | Użytkownik może się zalogować jako mentor albo mentee; chronione trasy odrzucają anonimowe żądania (fail closed). |
| #26-b | #26 "Done when" | `requireSession` / `requireRole` w `core/src/http/auth.ts`, 100% pokrycia (techniczne, bez ekranu). |
| #26-c | #26 "Done when" | Metoda logowania zapisana jako decyzja przed implementacją (zamknięte przez D10, zob. L15). |
| #25-1 | #25 | Zalogowany mentor zapisuje cenę 25 min i 50 min; obie widać w ofercie. |
| #25-2 | #25 (negatywne) | Długość inna niż 25 lub 50 min jest odrzucona (R01). |
| #25-3 | #25 | Mentee oglądający ofertę widzi cenę ustawioną przez mentora (R07). |
| #25-4 | #25 | Gdy prowizja nieustawiona (Q01), ceny zapisują się, a mentee nie widzi prowizji. |
| #27-1 | #27 | Mentor z cenami publikuje slot (data, godzina); pojawia się w jego kalendarzu jako otwarty. |
| #27-2 | #27 | Usunięty otwarty slot znika dla mentee. |
| #27-3 | #27 (negatywne) | Czas z przeszłości jest odrzucony. |
| #27-4 | #27 (negatywne) | Zarezerwowanego slotu nie da się usunąć (anulowanie wg R04). |
| #28-1 | #28 | Mentor z ofertą otwiera swój profil i widzi osobisty link, który otwiera jego ofertę. |
| #28-2 | #28 (negatywne) | Mentor bez opt-in nie jest na liście publicznej (R08). |
| #28-3 | #28 | Po opt-in mentor pojawia się na liście; po wyłączeniu znika. |
| #28-4 | #28 (negatywne) | Żaden wpis mentora nie pokazuje oceny ani wyniku (N02). |

### Reguły ze specyfikacji, które nie są kryteriami issues (to na nich opieram stany)

| Id | Reguła (spec) |
|---|---|
| U1 | Rejestracja mentee: imię, e-mail, hasło 12–128 znaków, rola `mentee`. |
| U2 | Zajęty e-mail przy rejestracji: ogólny `conflict`, nie potwierdza istnienia konta poza polem formularza. |
| U3 | Logowanie: błędne dane = jeden ogólny komunikat "Invalid email or password". |
| U4 | Limity: 5 nieudanych logowań / IP + e-mail / 15 min → 429 z czasem ponowienia; rejestracja 10 kont / IP / godzinę. |
| U5 | Nagłówek: *Log in* / *Register* albo imię + *Log out*; wylogowanie czyści ciasteczko. |
| U6 | Rejestracja mentora tylko z linku zaproszenia (`/register/mentor?token=…`), e-mail z zaproszenia, pola: imię, hasło. |
| U7 | Użyte, wygasłe, unieważnione lub nieznane zaproszenie: jeden ogólny komunikat "This invitation is no longer valid", bez formularza, bez szczegółów które z czterech. |
| U8 | Dwie równoległe rejestracje jednym tokenem: wygrywa dokładnie jedna. |
| U9 | Admin (= założyciel, D11) zaprasza e-mailem; link z tokenem pokazany tylko raz (przycisk kopiowania); lista: pending / used / expired; zaproszenie ważne 14 dni. |
| U10 | Ponowne zaproszenie tego samego e-maila tworzy nowe i unieważnia (revoked) poprzednie; stary link przestaje działać (Q6 ze spec). |
| U11 | `/register/mentor` pokazuje, jaki adres jest rejestrowany (Q7 ze spec). |
| U12 | Po sukcesie wszyscy na `/` (faza 1); od fazy 2 mentorzy na `/mentor`. |
| U13 | Strony admina odmawiają anonimowemu; `requireAdmin` działa w każdym środowisku. |
| U14 | Mentor rejestruje się na e-mail, który ma już konto: `conflict`; admin może awansować istniejące konto. |
| U15 | Zapis profilu wymaga imienia i nagłówka (1–120); bio, tagi, linki opcjonalne (Q8). Ceny 10–10 000 PLN (granice zdrowego rozsądku). |
| U16 | Profil tworzony leniwie przy pierwszej wizycie na `/mentor`. |
| U17 | `/mentor` = lista kontrolna do stanu "bookable": profil, ceny, ≥1 slot do rezerwacji, link, lista publiczna. |
| U18 | Slot: ≥24 h od teraz (D13), ≤60 dni, siatka 15 min, ≥50 min od innych slotów mentora, brak duplikatu; naruszenie = `validation_error` z komunikatem przy polu. |
| U19 | Czas nieistniejący (przesunięcie na czas letni) = odmowa "This time does not exist in your time zone"; niejednoznaczny = podgląd "Starts {dzień, data, godzina} ({strefa}, UTC{offset})". |
| U20 | Slot booked: usunięcie = `conflict` "Cancel the booking instead". Slot, który zestarzał się poniżej 24 h: pokazany jako "not bookable — starts too soon". |
| U21 | Lista publiczna: tylko `listed` ∧ ceny ustawione ∧ ≥1 slot do rezerwacji; kolejność wg najbliższego slotu. |
| U22 | `/m/[slug]` działa dla niewylistowanych (link); nieznany slug = `not_found`; mentor bez cen lub slotów: "No times available right now" (stan pusty, nie błąd). Przycisk *Book* to wyłączony zaślepek do #30. |
| U23 | Własność: mentor edytuje tylko własne dane (`assertOwner`), inny mentor lub rola = 403; admin nie jest wyjątkiem dla zapisów mentora. |
| U24 | Brief: ceny w PLN (D12), czasy z etykietą strefy, bez ocen (N02), bez wideo (N01). |

---

## 1. Mapa ekranów

Kolumna "stany" to krótkie nazwy; pełna lista stanów z historią/kryterium przy każdym jest w sekcji 1b. Komponenty DS są nazwami z `.ai/docs/design-system.md` (ścieżki w tabeli komponentów tam). Wspólne dla wszystkich ekranów: `PageLayout` + `AppHeader` + `AccountMenu` (+ `RoleNav` po zalogowaniu), nie powtarzam ich w każdym wierszu.

| ID | Ekran (trasa) | Rola: kto widzi | Stany | Historia / kryterium | Komponenty DS |
|---|---|---|---|---|---|
| s01 | Strona startowa `/` | gość, mentee, mentor, admin (treść zależy od roli) | domyślny (gość), domyślny (mentee), domyślny (mentor), domyślny (admin), ładowanie sesji, błąd sesji | U5, U12, #26-a; brief (R08) | `PageLayout`, `AppHeader`, `RoleNav`, `Item`/`ItemLink`, `Button`; luki G03, L04 |
| s02 | Rejestracja mentee `/register` | gość | domyślny, walidacja, wysyłanie, e-mail zajęty (409), limit rejestracji (429), błąd sieci, sukces, już zalogowany | #26-a, U1, U2, U4, U12 | `CrudForm` (`Field`, `Input`, `FieldError`), `Alert`, `Button`, `Spinner` |
| s03 | Logowanie `/login` | gość | domyślny, wysyłanie, błędne dane (401), za dużo prób (429), błąd sieci, sukces, sesja wygasła, już zalogowany | #26-a, U3, U4, U5, U12, L03, L13 | `CrudForm`, `Alert`, `Button`, `Spinner`; luka G02 |
| s04 | Rejestracja mentora z zaproszenia `/register/mentor?token=…` | gość (z linkiem) | sprawdzanie linku, domyślny (zaproszony e-mail), link nieważny, użyty w międzyczasie, walidacja hasła, e-mail ma już konto, limit (429), błąd sieci, sukces, brak tokenu, zalogowany otwiera link | U6, U7, U8, U11, U14, U12, U4 | `Skeleton`, `CrudForm`, `Alert`, `link-text`; luka L12 |
| s05 | Strona główna admina `/admin` | admin | domyślny, brak dostępu (nie admin), niezalogowany | U13, #26-a, D11 | `Item`, `ItemLink`, `RoleNav` |
| s06 | Zaproszenia `/admin/invitations` | admin | domyślny, ładowanie listy, pusta lista, błąd ładowania, wysyłanie, link pokazany raz, link zamknięty, błąd wysyłki, walidacja e-maila, ponowne zaproszenie (stary unieważniony), e-mail ma już konto, brak dostępu | U9, U10, U13, D11 | `CrudForm`, `DataTable`, `InvitationStatusBadge`, `InvitationLinkPanel`, `CopyField`, `Alert`, `ErrorMessage`, `LoadingMessage`, `EmptyState` |
| s07 | Panel mentora `/mentor` | mentor | nowy mentor, profil i ceny bez terminów, tylko terminy <24 h, oferta gotowa (niewylistowany), oferta gotowa i na liście, ładowanie, błąd ładowania, brak dostępu | #25-1, #27-1, #28-1, #28-3, U16, U17 | `OfferChecklist`, `Card`, `CopyField`, `Badge`, `Skeleton`, `ErrorMessage`; `PendingBookingsNotice` poza zakresem (L05) |
| s08 | Profil i ceny `/mentor/profile` | mentor (własny) | kompletny, nowy, ładowanie, błąd ładowania, zapisywanie, zapisano, walidacja, błąd zapisu, opt-in włączony, opt-out, ceny nieustawione, brak dostępu (403) | #25-1…#25-4, #28-1, #28-3, U15, U23 | `MentorProfileForm` (`Field`, `Input`, `Textarea`, `Checkbox` tagów, `InputGroup` ceny PLN), `CopyField`, `PriceList`, `Alert`, `Skeleton`; luka G04 |
| s09 | Terminy `/mentor/slots` | mentor (własny) | domyślny, pusty, ładowanie, błąd ładowania, dodawanie, dodany, czas odrzucony, czas nieistniejący (DST), czas niejednoznaczny (DST), potwierdzenie usunięcia, usunięty, konflikt (slot zarezerwowany), tylko <24 h, 60 slotów, brak cen, brak dostępu | #27-1…#27-4, U18, U19, U20, D13 | `AddSlotForm`, `SlotTimeField`, `SlotList`, `DeleteSlotDialog` (`AlertDialog`), `EmptyState`, `Alert`, `FieldError`, `Skeleton`, `Popover`; luka G05 |
| s10 | Lista mentorów `/mentors` | wszyscy (publiczna) | domyślny, filtr stosu, brak wyników, nikt na liście, ładowanie, błąd, wiele (paginacja), długie wartości/częściowy profil | #28-2, #28-3, #28-4, #25-3, U21, R08, N02 | `MentorCard` (`TagList`, `PublicWorkLinks`, `PriceList`), `ResultCount`, `ActiveFilters`, `NativeSelect`, `Pagination`, `EmptyState`, `ErrorMessage`, `Skeleton` |
| s11 | Strona mentora `/m/[slug]` (link do udostępniania) | wszyscy (publiczna) | domyślny, *Book* wyłączony z powodem, brak terminów, nie znaleziono, częściowy profil, długie wartości, ładowanie, błąd | #28-1, #25-3, #28-4, U22, R08, D03 | `MentorProfileHeader`, `PriceList`, `TagList`, `PublicWorkLinks`, `SlotList`, `SlotBookActions`/`Button` (wyłączony), `EmptyState`, `ErrorMessage`, `Skeleton` |
| s12 | Brak dostępu / nie znaleziono (wspólny) | gość (401), zalogowany z inną rolą (403), każdy (404) | brak logowania (401), zła rola (403), nie znaleziono (404), sesja wygasła przy akcji | #26-a (fail closed), U13, U23; L02, L03 | `ErrorMessage` / `Alert` + link; brak dedykowanej strony: luka G01 |

Role: kto co widzi na ekranie chronionym (siatka dostępu).

| Ekran | Gość | Mentee | Mentor | Admin |
|---|---|---|---|---|
| s01 `/` | widzi (wersja gość) | widzi (wersja mentee) | widzi (wersja mentor) | widzi (wersja admin) |
| s02 `/register` | widzi | już zalogowany (L13) | już zalogowany (L13) | już zalogowany (L13) |
| s03 `/login` | widzi | już zalogowany (L13) | już zalogowany (L13) | już zalogowany (L13) |
| s04 `/register/mentor` | widzi (z tokenem) | L13 | L13 | L13 |
| s05 `/admin` | s12 (401) | s12 (403) | s12 (403) | widzi |
| s06 `/admin/invitations` | s12 (401) | s12 (403) | s12 (403) | widzi |
| s07 `/mentor` | s12 (401) | s12 (403) | widzi | s12 (403) |
| s08 `/mentor/profile` | s12 (401) | s12 (403) | widzi (własny) | s12 (403) |
| s09 `/mentor/slots` | s12 (401) | s12 (403) | widzi (własne) | s12 (403) |
| s10 `/mentors` | widzi | widzi | widzi | widzi |
| s11 `/m/[slug]` | widzi | widzi | widzi | widzi |

Uwaga do wiersza s12: spec nie mówi, czy gość na chronionej stronie dostaje przekierowanie do `/login`, czy stronę z komunikatem (L02); DS mówi, że "not found" i "brak dostępu" mają jeden komunikat. Mapa przyjmuje s12 jako roboczy ekran do czasu odpowiedzi.

### 1b. Stany ekranów (pełna lista, każdy z historią lub kryterium)

Identyfikator stanu = `sNN.k`. Stan oznaczony **(luka Lxx)** nie jest opisany w specyfikacji; w prototypie pokażę go dopiero po odpowiedzi właściciela.

#### s01 Strona startowa `/`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s01.1 domyślny: gość | tytuł, krótki opis oferty, link do `/mentors`, *Log in*, *Register* | U5, brief (R08 lista publiczna) |
| s01.2 domyślny: mentee | nawigacja *Mentors* (+ *My bookings*, zob. L05), imię + *Log out* | U5, U12; **(luka L04)** zawartość nieopisana |
| s01.3 domyślny: mentor | link do `/mentor` (od fazy 2 lądowanie na `/mentor`) | U12; **(luka L04)** |
| s01.4 domyślny: admin | link do `/admin` | U12, U13; **(luka L04)** dokąd ląduje admin |
| s01.5 ładowanie sesji | szkielet nagłówka, `GET /api/auth/me` w toku | U5 |
| s01.6 błąd sesji | `me` nie odpowiada | **(luka L03)** brak opisu; zachowanie: jak gość |

#### s02 Rejestracja mentee `/register`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s02.1 domyślny | imię, e-mail, hasło (12–128), *Create account* | #26-a, U1 |
| s02.2 walidacja | hasło krótsze niż 12 znaków, zły e-mail, puste imię: błąd przy polu, fokus na pierwszym | U1 |
| s02.3 wysyłanie | przycisk *Saving…* ze `Spinner`, pola zablokowane | U1 |
| s02.4 konflikt: e-mail zajęty (409) | ogólny komunikat przy polu e-mail, który nie potwierdza istnienia konta | U2 |
| s02.5 limit rejestracji (429) | komunikat z czasem ponowienia (10 kont / IP / h) | U4 |
| s02.6 błąd sieci | `Alert`, wpisane wartości zostają | U1 |
| s02.7 sukces | konto utworzone, przejście na `/` jako mentee | #26-a, U12 |
| s02.8 już zalogowany | użytkownik z sesją otwiera `/register` | **(luka L13)** |

#### s03 Logowanie `/login`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s03.1 domyślny | e-mail, hasło, *Log in*, link do `/register` | #26-a, U5 |
| s03.2 wysyłanie | *Logging in…* | #26-a |
| s03.3 błędne dane (401) | "Invalid email or password", bez wskazania pola | U3 |
| s03.4 za dużo prób (429) | blokada z czasem ponowienia (5 prób / 15 min) | U4 |
| s03.5 błąd sieci | `Alert`, wpisane wartości zostają | #26-a |
| s03.6 sukces | mentee i admin → `/`, mentor → `/mentor` | U12 |
| s03.7 sesja wygasła | powrót po 24 h bez odświeżania, informacja przy formularzu | **(luka L03)** brak opisu |
| s03.8 już zalogowany | użytkownik z sesją otwiera `/login` | **(luka L13)** |

Brak ścieżki "Forgot password?": spec przewiduje reset przez założyciela (`auth:set-password`), brak ekranu: **L12**.

#### s04 Rejestracja mentora `/register/mentor?token=…`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s04.1 sprawdzanie linku | `Skeleton`, `GET /api/auth/invitations/[token]` | U6, U11 |
| s04.2 domyślny | zaproszony adres e-mail (niezmienny), pola: imię, hasło, *Create mentor account* | U6, U11 |
| s04.3 link nieważny | jeden komunikat "This invitation is no longer valid", prośba o nowy link do założycieli, brak formularza; identyczny dla: użyty, wygasły, unieważniony, nieznany | U7, U10 |
| s04.4 użyty w międzyczasie | formularz był otwarty, token zużyty w innej karcie lub przez drugą rejestrację | U8 |
| s04.5 walidacja hasła | 12–128 znaków, puste imię | U6 |
| s04.6 konflikt: e-mail ma już konto | ktoś zarejestrował się wcześniej jako mentee; wskazówka: założyciele mogą awansować konto | U14 |
| s04.7 limit (429) | rejestracja ograniczona do 10 kont / IP / h | U4 |
| s04.8 błąd sieci | `Alert`, wpisane wartości zostają | U6 |
| s04.9 sukces | konto `mentor`, sesja, przejście na `/mentor` (faza 2+; w fazie 1b `/`) | U12 |
| s04.10 brak tokenu w adresie | `/register/mentor` bez `?token` | **(luka L12/L13)** traktuję jak s04.3 do decyzji |
| s04.11 zalogowany otwiera link | np. admin sprawdza swój link | **(luka L13)** |

Wynik zewnętrznej usługi: nie dotyczy (E01 nie wywołuje Stripe ani poczty; link dostarcza założyciel ręcznie, D15).

#### s05 Strona główna admina `/admin`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s05.1 domyślny | gęsta lista sekcji: *Users*, *Invitations* | U13, D11 |
| s05.2 brak dostępu | mentee lub mentor otwiera `/admin` | U13, #26-a → s12 |
| s05.3 niezalogowany | gość otwiera `/admin` | #26-a, U13 → s12 / **(luka L02)** |

#### s06 Zaproszenia `/admin/invitations`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s06.1 domyślny | formularz e-mail + lista (pending, used, expired; znaczniki `InvitationStatusBadge`) z datami | U9 |
| s06.2 ładowanie listy | `LoadingMessage` / `DataTable` w ładowaniu | U9 |
| s06.3 pusta lista | "No invitations yet" + pole zaproszenia | U9 |
| s06.4 błąd ładowania | `ErrorMessage` z *Try again* | U9 |
| s06.5 wysyłanie | *Inviting…* | U9 |
| s06.6 link pokazany raz | `InvitationLinkPanel` z `CopyField` i ostrzeżeniem "shown once", przycisk *Done* | U9 |
| s06.7 link zamknięty | po *Done* linku nie da się odzyskać; wiersz *pending* bez linku | U9 |
| s06.8 błąd wysyłki | `Alert`, wpisany e-mail zostaje | U9 |
| s06.9 walidacja e-maila | błąd przy polu | U9 |
| s06.10 konflikt: ponowne zaproszenie | nowy link raz; poprzedni wiersz oznaczony *Revoked* | U10, **L10** (status nie ma opisu w spec) |
| s06.11 konflikt: e-mail ma już konto | admin zaprasza adres istniejącego użytkownika | **(luka L11)** |
| s06.12 brak dostępu | nie-admin → s12 | U13 |

#### s07 Panel mentora `/mentor`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s07.1 nowy mentor | profil leniwie utworzony, `OfferChecklist`: wszystko "do zrobienia" | U16, U17 |
| s07.2 profil i ceny, bez terminów | brakuje: ≥1 slot do rezerwacji | #25-1, U17 |
| s07.3 tylko terminy <24 h | slot istnieje, ale nie jest do rezerwacji; wyjaśnienie | U20, D13 |
| s07.4 oferta gotowa, niewylistowany | link do udostępniania (`CopyField`), lista publiczna: nieaktywna | #28-1, #28-2, R08 |
| s07.5 oferta gotowa i na liście | link + "listed" | #28-3, U21 |
| s07.6 ładowanie | `Skeleton` | U17 |
| s07.7 błąd ładowania | `ErrorMessage` | U17 |
| s07.8 brak dostępu | inna rola → s12 | U23 |

Rezerwacje oczekujące (`PendingBookingsNotice`) to E02: poza mapą (L05).

#### s08 Profil i ceny `/mentor/profile`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s08.1 kompletny | imię, nagłówek, bio, tagi, ≤5 linków https, ceny 25/50 min w PLN | #25-1, U15 |
| s08.2 nowy | tylko imię; reszta pusta | U15, U16 |
| s08.3 ładowanie | `Skeleton` | U15 |
| s08.4 błąd ładowania | `ErrorMessage` | U15 |
| s08.5 zapisywanie | *Saving…* | #25-1 |
| s08.6 zapisano | potwierdzenie tekstem przy akcji (bez toastu) | #25-1, #25-4 |
| s08.7 walidacja | brak imienia/nagłówka (>120 znaków), cena poza 10–10 000 PLN, link nie-https lub >5 | U15; **L09** dla #25-2 |
| s08.8 błąd zapisu | `Alert` (serwer/sieć), wartości zostają | #25-1 |
| s08.9 opt-in włączony | przełącznik/pole *Show me on the public list* = tak; wyjaśnienie warunków listingu | #28-3, R08, **L07** |
| s08.10 opt-out | = nie; mentor znika z `/mentors`, link działa dalej | #28-2, #28-3, D03 |
| s08.11 ceny nieustawione | "Not set"; zapis możliwy bez prowizji | #25-4, Q01 |
| s08.12 brak dostępu (403) | rola inna niż mentor → s12; mentor nie edytuje cudzego profilu | U23 |

Link do udostępniania: w spec na `/mentor` (checklista), w #28-1 w "profilu": **L08**.

#### s09 Terminy `/mentor/slots`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s09.1 domyślny | lista pogrupowana wg dni, czasy z etykietą strefy; statusy: otwarty, zbyt wcześnie, zarezerwowany | #27-1, U20 |
| s09.2 pusty | "No slots yet" + *Add slot* | #27-1 |
| s09.3 ładowanie | `Skeleton` | #27-1 |
| s09.4 błąd ładowania | `ErrorMessage` | #27-1 |
| s09.5 dodawanie | *Adding…* | #27-1 |
| s09.6 dodany | wiersz z statusem otwarty, fokus wraca do nagłówka/pola | #27-1 |
| s09.7 czas odrzucony | <24 h (w tym przeszłość), >60 dni, poza siatką 15 min, <50 min od innego slotu, duplikat: komunikat przy polu | #27-3, U18, D13 |
| s09.8 czas nieistniejący (DST) | "This time does not exist in your time zone" | U19 |
| s09.9 czas niejednoznaczny (DST) | podgląd "Starts … (strefa, UTC+offset)" przed zapisem | U19 |
| s09.10 potwierdzenie usunięcia | `AlertDialog`, bezpieczny wybór pierwszy | #27-2 |
| s09.11 usunięty | wiersz znika, fokus na nagłówku | #27-2 |
| s09.12 konflikt: slot zarezerwowany | "Cancel the booking instead", brak akcji usunięcia | #27-4, U20 |
| s09.13 tylko terminy <24 h | wszystkie sloty "not bookable — starts too soon" | U20, D13 |
| s09.14 60 slotów | najdłuższa lista; grupowanie wg dni | U18 |
| s09.15 brak cen | mentor bez cen próbuje dodać slot | **(luka L06)** #27-1 mówi "mentor z cenami", spec nie wymaga |
| s09.16 brak dostępu | inna rola → s12 | U23 |

#### s10 Lista mentorów `/mentors`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s10.1 domyślny | `ResultCount` + wiersze `MentorCard` (imię, nagłówek, tagi, linki, ceny 25/50 PLN, najbliższy termin), bez ocen | #28-3, #28-4, #25-3, U21 |
| s10.2 filtr stosu | `ActiveFilters`, mniejszy wynik | U21 |
| s10.3 brak wyników | "No mentors match" + *Clear filters* | U21 |
| s10.4 nikt na liście | stan pusty: dlaczego pusto i co dalej (brak ścieżki "zaproś mentora", spec nie ma) | #28-2, R08 |
| s10.5 ładowanie | `Skeleton` | U21 |
| s10.6 błąd | `ErrorMessage` | U21 |
| s10.7 wiele | 25 mentorów, paginacja | U21 |
| s10.8 długie wartości, częściowy profil | nagłówek 120 znaków, 5 linków, 4 tagi; brak opcjonalnych części | U15, U21 |

Bez stanu "brak dostępu": ekran publiczny. Mentor niewylistowany ma być nieobecny (#28-2) bez żadnego śladu.

#### s11 Strona mentora `/m/[slug]`

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s11.1 domyślny | nagłówek mentora, ceny, tagi, linki, sloty do rezerwacji (`SlotList`, czasy z etykietą strefy) | #28-1, #25-3, U22 |
| s11.2 *Book* wyłączony z powodem | przycisk nieaktywny, powód widoczny tekstem | U22 (zaślepek do #30), **L05** |
| s11.3 brak terminów | "No times available right now" (stan pusty, nie błąd); także gdy mentor bez cen | U22, D13, **L14** |
| s11.4 nie znaleziono | nieznany slug, wspólny komunikat z "brak dostępu" | U22 |
| s11.5 częściowy profil | brak bio, tagów, linków | U15 |
| s11.6 długie wartości | najdłuższe pola, 60 slotów | U15, U18 |
| s11.7 ładowanie | `Skeleton` | U22 |
| s11.8 błąd | `ErrorMessage` | U22 |

Niewylistowany mentor otwiera się tym samym stanem s11.1 (D03).

#### s12 Brak dostępu / nie znaleziono (wspólny)

| Stan | Co widać | Historia / kryterium |
|---|---|---|
| s12.1 brak logowania (401) | gość na stronie chronionej | #26-a; **(luka L02)** przekierowanie czy komunikat |
| s12.2 zła rola (403) | zalogowany mentee na `/mentor`, mentor na `/admin` itd. | U13, U23; **(luka L02)** |
| s12.3 nie znaleziono (404) | dowolny nieistniejący adres | wspólny komunikat z 403 (reguła DS) |
| s12.4 sesja wygasła przy akcji | 401 po zapisie formularza po 24 h | **(luka L03)** |

---

## 2. Scenariusze do przełączania w prototypie

Kontrolki prototypu (panel "Scenariusz" poza produktem), nie funkcje produktu. Każdy scenariusz ustawia stan i prowadzi do konkretnych stanów z 1b.

| Id | Kontrolka | Wartości | Pokazuje |
|---|---|---|---|
| c01 | Rola | gość / mentee / mentor / admin | s01.1–s01.4, siatka dostępu, s12 |
| c02 | Zaproszenie (token w linku) | ważne / użyte / wygasłe / unieważnione / nieznane | s04.2 albo s04.3 (cztery nieważne wyglądają tak samo, U7; kontrolka służy sprawdzeniu, że prototyp ich nie rozróżnia) |
| c03 | Zaproszenie użyte w międzyczasie | wł / wył | s04.4 (U8) |
| c04 | E-mail zajęty | wł / wył | s02.4 (mentee), s04.6 (mentor) |
| c05 | Błędne hasło | wł / wył | s03.3 |
| c06 | Za dużo prób | logowanie / rejestracja mentee / rejestracja mentora | s03.4, s02.5, s04.7 |
| c07 | Sesja wygasła | wł / wył | s03.7, s12.4 (po decyzji L03) |
| c08 | Sieć / serwer | ok / błąd sieci / błąd 500 | s02.6, s03.5, s04.8, s06.4, s07.7, s08.4, s09.4, s10.6, s11.8 |
| c09 | Wczytywanie | normalne / wolne | wszystkie stany "ładowanie" |
| c10 | Lista zaproszeń | pełna / pusta / błąd | s06.1, s06.3, s06.4 |
| c11 | Ponowne zaproszenie tego samego e-maila | wykonaj | s06.10: stary wiersz *Revoked*, stary link w c02 staje się nieważny |
| c12 | Link zaproszenia zgubiony | wykonaj (zamknij panel linku) | s06.7 i potrzeba ponownego zaproszenia (c11) |
| c13 | Stan oferty mentora | nowy / ceny bez terminów / tylko <24 h / gotowa niewylistowana / gotowa na liście | s07.1–s07.5 |
| c14 | Opt-in | wł / wył | s08.9, s08.10, obecność w s10 (c20) |
| c15 | Brak slotów | wł / wył | s09.2, s11.3, wykluczenie z s10 |
| c16 | Slot zarezerwowany w międzyczasie | wł / wył | s09.12 |
| c17 | Zegar demo | stały "teraz" + przesunięcie (+6 h / +24 h) | slot przechodzi w "too soon" (s09.1, s09.13, s07.3); zmiana tego, co widzi mentee w s11 |
| c18 | Czas lokalny | Europe/Warsaw / inna strefa przeglądarki | etykiety stref, różnica czasu mentor / mentee (U19) |
| c19 | DST | brak / luka / niejednoznaczny | s09.8, s09.9 (niedziela 2026-10-25, zmiana czasu o 03:00 na 02:00) |
| c20 | Lista publiczna | pusta / kilku / 25 (paginacja) / długie wartości | s10.4, s10.1, s10.7, s10.8 |
| c21 | Filtr stosu | brak / TypeScript / ... / bez wyników | s10.2, s10.3 |
| c22 | Szerokość | 1280 / 320 px | każdy ekran (DS wymaga 320 px) |

---

## 3. Konta i dane demo (wszystko fikcyjne)

Domena `@example.com`, hasła demo (≥12 znaków). Dane spójne z fixtures DS (`packages/ui/stories/mocks/fixtures.ts`), żeby prototyp i Storybook mówiły to samo.

**"Teraz" zegara demo:** piątek 2026-10-23, 10:00 czasu Europe/Warsaw (UTC+2, 08:00Z). Okno rezerwacji zaczyna się w sobotę 2026-10-24 o 10:00 (D13: ≥24 h). W niedzielę 2026-10-25 o 03:00 zmiana na czas zimowy (UTC+1): sloty od 26 października są w UTC+1. Horyzont 60 dni: do 2026-12-22.

| Rola | Konto | E-mail | Hasło demo | Stan wyjściowy |
|---|---|---|---|---|
| mentee | Ola Wiśniewska | ola.wisniewska@example.com | ingress-1-28-upgrade | zarejestrowana, brak rezerwacji (E02 poza zakresem) |
| mentor | Marek Zieliński | marek.zielinski@example.com | helm-chart-rollback-2 | zaproszenie użyte, oferta gotowa, na liście; slug `marek-zielinski-k3x9q2` |
| admin | Oliwia Nowak | oliwia.nowak@example.com | demo-admin-passphrase-1 | założycielka (D11), jedyna rola admin w demo |

**Oferta Marka (PLN, zapisane w groszach):** 25 min: 180,00 PLN (18 000); 50 min: 320,00 PLN (32 000); nagłówek "Platform engineer – Kubernetes, Helm, CI pipelines"; tagi Python, AI agents; linki https://github.com/marek-zielinski i https://kubecon.example/talks/helm-rollbacks-without-tears. Brak prowizji w widoku (Q01).

**Sloty Marka (czas Europe/Warsaw):**

| Termin | Status | Dlaczego |
|---|---|---|
| pt 23.10, 16:00 | otwarty, zbyt wcześnie | <24 h od "teraz" (D13) |
| sob 24.10, 09:30 | otwarty, zbyt wcześnie | 23,5 h od "teraz" |
| sob 24.10, 12:00 | otwarty, do rezerwacji | pierwszy rezerwowalny |
| pon 26.10, 18:00 i 19:30 | otwarte | dwa w jeden dzień (spacing ≥50 min) |
| śr 28.10, 18:00 | zarezerwowany | dla s09.12 |
| pt 30.10, 17:00 | otwarty | |
| pon 2.11, 18:00 | otwarty | |
| ndz 25.10, 02:30 | do wpisania w c19 | czas niejednoznaczny (dwukrotnie 02:00–02:59) |
| 2026-12-28 | do wpisania | poza horyzontem 60 dni |

**Zaproszenia (lista admina):**

| E-mail | Status | Uwagi |
|---|---|---|
| anna.maj@example.com | pending | ważne do 2026-11-06; to konto "nowego mentora" w s04 |
| marek.zielinski@example.com | used | użyte 2026-10-10 |
| jan.sowa@example.com | expired | wygasło 2026-10-04 |
| tomasz.kowalczyk@example.com | revoked (po c11) | ponowne zaproszenie tego samego e-maila |

**Pozostali mentorzy na liście publicznej (bez logowania, tylko dane publiczne):**

| Mentor | Nagłówek | Tagi | 25 / 50 min (PLN) | Najbliższy termin |
|---|---|---|---|---|
| Kasia Lewandowska | Frontend lead – React performance and accessibility | TypeScript, React | 150 / 260 | wt 27.10, 19:00 |
| Piotr Wójcik | Backend engineer – Postgres, queues and the incidents between them | TypeScript, Python | 200 / 360 | czw 29.10, 18:30 |
| Nina Kamińska | Building agents with tool calling and evals | AI agents, Python, TypeScript | 220 / 400 | pt 30.10, 17:30 |

Brak ocen, gwiazdek i liczników na każdej karcie (N02). Dane skrajne (c20): mentor z 120-znakowym nagłówkiem, pięcioma linkami i czterema tagami (fixture `publicMentorLong`), 25 mentorów dla paginacji.

---

## 4. Luki w specyfikacji (z pytaniem do właściciela)

### Decyzje właściciela (2026-10-23)

- L01: brak weryfikacji e-maila w 1.0.
- L02/L03: gość lub zła rola na `/mentor` albo `/admin` → przekierowanie na `/login`, po zalogowaniu powrót na poprzednią stronę; wygasła sesja w trakcie zapisu → `/login` z komunikatem "Your session has ended".
- L04: po zalogowaniu mentee → `/mentors`, mentor → `/mentor`, admin → `/admin`.
- L05: w prototypie E01 *Book* jest wyłączony z widocznym powodem; *My bookings* ukryte; brak nawigacji do E02.
- L06: mentor bez cen może dodawać sloty (nie są listowane); lista grupowana wg dni; kryterium #27-3 doprecyzowane jako "mniej niż 24 h wyprzedzenia".
- L07/L08: mentor po opt-in bez cen lub slotów widzi brakujące elementy na liście kontrolnej; link do udostępniania jest widoczny na `/mentor` i `/mentor/profile` od momentu zapisania profilu.
- L10: admin nie może unieważnić zaproszenia bez wystawiania nowego (poza specyfikacją).
- L11: e-mail, który ma już konto → "This address already has an account – log in".
- L12: brak kontaktu do założycieli na stronie nieważnego linku – "Ask the founders for a new link".
- L14: `/m/[slug]` i `/mentors` mówią wprost, że rezerwacja wymaga co najmniej 24 h wyprzedzenia (D13).
- Bez zmian (otwarte): L09, L13, L15, L16.

Poniższa tabela zachowuje oryginalne sformułowania luk.

Nie rozstrzygam żadnej. Rodzaje: [K] kryterium bez ekranu lub stanu, [S] stan potrzebny przepływowi a nieopisany, [X] sprzeczność spec / brief / DS / issue, [D] decyzja, której nikt nie podjął.

| Id | Rodzaj | Luka | Pytanie do właściciela |
|---|---|---|---|
| L01 | D | Spec zapisuje brak weryfikacji e-maila jako znane ograniczenie (konta, nagłówek "Known limitations"). W wywiadzie 2026-09-01 mentee mówi o założeniu konta i weryfikacji maila jako tarciu ("nie że zakładam konto, weryfikacja maila, potem czekam"). | Czy chcesz weryfikację e-maila w 1.0? (Mapa jej nie zawiera.) |
| L02 | S | 401 i 403 istnieją w API, ale spec nie mówi, co widzi człowiek: gość na `/mentor` lub `/admin`, mentee na `/mentor`, mentor na `/admin`; ani gdzie ląduje po wylogowaniu i czy po zalogowaniu wraca na stronę, z której przyszedł (np. z `/m/[slug]`). DS: "not found" i "brak dostępu" jedną wiadomością. | Gość na stronie chronionej: przekierowanie na `/login` (z powrotem po zalogowaniu) czy strona z komunikatem? Zła rola: ten sam komunikat co "nie znaleziono"? Dokąd po *Log out*? |
| L03 | S | Sesja trwa 24 h bez odświeżania; nie ma opisu, co się dzieje, gdy wygaśnie na otwartym formularzu (profil, nowy slot, zaproszenie). DS mówi, że wpisane wartości zostają, ale nie ma ekranu. | Co ma zobaczyć mentor, któremu sesja wygasła w trakcie zapisu: komunikat i logowanie bez utraty wpisanych danych? Czy ma wrócić na tę samą stronę? |
| L04 | D | Spec: po sukcesie "everyone lands on `/`" (faza 1), od fazy 2 mentorzy na `/mentor`. Nic o mentee i adminie ani o treści `/` dla zalogowanego. Dzisiejsze `/` mówi "The mentor list is not open yet" i jest w audycie jako stare UI. Dla prototypu pełnego E01 zakładam `/mentor` dla mentora (faza 2+). | Gdzie lądują mentee i admin po zalogowaniu i co pokazuje `/` dla każdej z ról? Czy admin ląduje na `/admin`? |
| L05 | X | Spec: *Book* na `/m/[slug]` to wyłączony zaślepek do #30. DS ma już gotowe `SlotBookActions`, `BookingForm`, a nawigacja mentee zawiera *My bookings*, mentora *Bookings*, `/mentor` ma `PendingBookingsNotice` (E02). | W prototypie E01: pokazać *Book* wyłączony z widocznym powodem, a *My bookings* / *Bookings* ukryć? Czy klik ma prowadzić do E02? |
| L06 | X | #27-3: "czas z przeszłości odrzucony", spec: odrzuca wszystko <24 h (D13), a #27-1 mówi "mentor z cenami" i "kalendarz", spec: sloty grupowane wg dni, siatka kalendarza "not built", i nie wymaga cen do publikacji slotu. | Czy mentor bez cen może dodawać sloty? Czy lista wg dni wystarcza zamiast "kalendarza"? Czy kryterium #27-3 ma brzmieć "<24 h"? |
| L07 | X | #28-3: po opt-in mentor "pojawia się" na liście; spec: tylko gdy też ma ceny i ≥1 slot do rezerwacji. Co widzi mentor, który włączył opt-in, a nie jest na liście? | Czy mentor po opt-in bez cen lub slotów ma zobaczyć wyjaśnienie "włączone, ale jeszcze niewidoczny, bo…"? |
| L08 | X | #28-1: link "na profilu"; spec: link na `/mentor` (lista kontrolna), na `/mentor/profile` tylko przełącznik listy. Nie wiadomo, czy link jest widoczny, zanim oferta jest gotowa (R08: link ma każdy mentor). | Gdzie ma być link do udostępniania (`/mentor`, `/mentor/profile` czy oba) i czy widać go od razu, czy dopiero gdy oferta jest gotowa? |
| L09 | K | #25-2 (długość inna niż 25/50 odrzucona): UI ma dwa stałe pola cen, więc ścieżki nie da się wywołać z ekranu; istnieje tylko w API i testach. | Potwierdzasz, że to kryterium nie ma ekranu w prototypie (sprawdzane testem), a pokazujemy tylko dwie ceny? |
| L10 | X | Spec UI: lista zaproszeń "pending / used / expired"; DS i spec (Q6) mają też *Revoked*. Brak sposobu unieważnienia bez wystawiania nowego zaproszenia. | Czy lista ma cztery statusy (z *Revoked*)? Czy admin ma móc unieważnić zaproszenie bez ponownego zapraszania? |
| L11 | S | Co się dzieje, gdy admin zaprasza e-mail, który już ma konto (mentee lub mentor)? Spec obsługuje to dopiero przy rejestracji (`conflict`), z obejściem "admin awansuje konto". | Czy panel zaproszeń ma wykrywać istniejące konto już przy zapraszaniu i co wtedy pokazać? |
| L12 | D | Nieważny link zaproszenia mówi "ask the founders for a new one", a brak ścieżki "zapomniałem hasła" odsyła do założyciela (reset ręczny). Spec nie podaje kanału kontaktu. | Jaki kontakt do założycieli ma być na stronie nieważnego linku i na logowaniu (adres e-mail, formularz, inny)? |
| L13 | S | Zalogowany użytkownik otwiera `/login`, `/register` lub `/register/mentor?token=…` (np. admin sprawdza własne zaproszenie); `/register/mentor` bez tokenu. | Przekierować na stronę startową roli, pokazać "jesteś zalogowany", czy pozwolić dokończyć? Bez tokenu: jak nieważny link? |
| L14 | X | Brief: najbardziej prawdopodobna przyczyna odejścia to potrzeba pomocy w ciągu dnia, a D13 daje najwcześniej 24 h. Strony publiczne pokazują tylko sloty do rezerwacji, więc mentee nie wie, dlaczego "dzisiaj" nic nie ma ("No times available right now" bez wyjaśnienia). | Czy `/m/[slug]` i `/mentors` mają powiedzieć wprost, że termin rezerwuje się z co najmniej 24 h wyprzedzeniem? |
| L15 | X | Dokumenty niespójne: issue #26 nadal ma "Blocking: which sign-in method" i "No spec yet", choć D10 i spec istnieją; D11 mówi `npm run auth:create-admin`, spec `auth:set-password --admin`; Q6/Q7 w spec (ponowne zaproszenie, pokazanie e-maila) mają inne znaczenie niż Q06 w briefie (kto płaci), a brief numeruje Q01–Q06. | Czy zaktualizować #26, D11 i numerację pytań, zanim komentarze w prototypie zaczną na nie wskazywać? |
| L16 | K | Spec mówi, że konflikt e-maila mentora rozwiązuje "awans konta" w edycji użytkownika, ale `/admin/users` nie jest w tym epiku opisany jako ekran (dziś działa w aplikacji). | Czy ekran `/admin/users` (zmiana roli) ma być w prototypie, czy tylko jako odnośnik z s05? |

Rozbieżność z zadaniem, nie luka: wywiady i personas. W `research/` nie ma osobnych plików z personami, tylko wywiady; nie wymyślałem person, scenariusze zbudowałem z reguł specyfikacji.

---

## 5. Luki w design systemie

Sprawdzone w `packages/ui` (komponenty, `stories/product/E01/screens/`, `WhatIsMissing.mdx`) i `.ai/docs/design-system.md`. Gotowe są ekrany Storybooka dla: `/login`, `/register`, `/register/mentor`, `/admin`, `/admin/invitations`, `/mentor`, `/mentor/profile`, `/mentor/slots`, `/mentors`, `/m/[slug]`. Nie mają ekranu:

| Id | Luka | Dotyczy | Uwaga |
|---|---|---|---|
| G01 | Brak strony "Brak dostępu / nie znaleziono" jako ekranu lub wzorca: jest tylko story `Forbidden` na `/mentor/profile` (alert przy zapisie) oraz reguła "jeden komunikat" w DS. | s12 | Prototyp zacznie od `ErrorMessage` + link; potrzebna decyzja L02. |
| G02 | Brak wariantu "Sesja wygasła" na `/login` (komunikat nad formularzem) i brak stanu 401 w trakcie akcji. | s03.7, s12.4 | L03. |
| G03 | Brak ekranu `/` dla gościa, mentee i mentora (jest tylko `AdminHome`, `MentorHome`); app `page.tsx` nadal ze starym hero (audyt w `WhatIsMissing.mdx`, priorytet High). | s01 | Treść z briefu, bez hero i kart; L04. |
| G04 | Sprzeczność w DS: tabela komponentów podaje `Switch` dla "Show me on the public list", reguły "If … then" mówią, że opcja listy jest `Checkbox` (Q15, zapisywana z formularzem). | s08.9, s08.10 | Który komponent jest obowiązujący? (pytanie do właściciela DS, nie do specyfikacji) |
| G05 | Brak siatki kalendarza ("not built"), a #27 mówi "kalendarz". Jest `SlotList` grupowana wg dni. | s09 | L06. |
| G06 | Brak stanu "zalogowany na stronie dla gości" i "bez tokenu" jako wariantów `Login`/`Register`/`RegisterMentor`. | s02.8, s03.8, s04.10, s04.11 | L13. |
| G07 | Nie sprawdziłem, czy `AccountMenu` i `AppHeader` mają stan "sesja się ładuje / sesja nieznana" (s01.5, s01.6); w tabeli komponentów go nie widać. | s01 | Do sprawdzenia przy budowie prototypu. |

---

## 6. Liczby

| Miara | Liczba |
|---|---|
| Ekrany | 12 (s01–s12; w tym 1 wspólny ekran błędu dostępu s12, którego spec nie opisuje jako strony) |
| Stany (wiersze `sNN.k` w sekcji 1b) | 104 (s01: 6, s02: 8, s03: 8, s04: 11, s05: 3, s06: 12, s07: 8, s08: 12, s09: 16, s10: 8, s11: 8, s12: 4) |
| z tego stany nieopisane w spec (oznaczone "luka") | 15 |
| Scenariusze (kontrolki) | 22 (c01–c22) |
| Konta demo | 3 (mentee, mentor, admin) + 3 mentorów publicznych bez logowania + 4 zaproszenia |
| Luki w specyfikacji | 16 (L01–L16): 3 decyzje, 4 stany nieopisane, 7 sprzeczności, 2 kryteria bez ekranu |
| Luki w design systemie | 7 (G01–G07) |
| Historie i kryteria | 4 historie (#25, #26, #27, #28) + 1 zadanie #26; 15 kryteriów z issues (#26-a…c, #25-1…4, #27-1…4, #28-1…4) + 24 reguły ze spec (U1–U24) |

Kolejny krok po Twoich odpowiedziach na luki i zatwierdzeniu: skill `om-mockup-prototype`. Do tego czasu mapa się nie zmienia poza dopisaniem decyzji przy lukach.
