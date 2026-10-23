# POSTĘP: klikalny prototyp Epiku 01 (konta, role, oferta mentora)

Zadanie: `lekcja-07/klikalny-prototyp-devmentor.txt` (ćwiczenie 2b), dostosowane do repo. Nowa sesja: przeczytaj prompt, mapę ekranów i ten plik, kontynuuj od „Następny krok”.

## Materiały (wersja dla tego repo)

- Mapa ekranów: `lekcja-07/mapa-ekranow.md` (decyzje właściciela 2026-10-23 na początku sekcji 4; ID ekranów s01–s12, stanów sNN.k, scenariuszy c01–c22, luk L/G stałe).
- Szary prototyp (zachowanie, założenia A01–A10): `.ai/prototypes/discovery/mentor-onboarding/revision-001/` (`index.html`, `README.md`). A01–A06 zaakceptowane, A07–A10 otwarte.
- Spec: `.ai/specs/2026-10-19-mentor-accounts-and-offer.md`; brief: `.ai/specs/product-brief.md` (D10–D16, N01–N03).
- Design system: `packages/ui` (`src/styles/tokens.css`, `theme.css`, `src/components/ui`, `src/components/{auth,mentors,availability}`, `src/backend`), `.ai/docs/design-system.md`, `AGENTS.md`, `packages/ui/AGENTS.md`. Wzorce składania ekranów: `packages/ui/stories/product/E01/screens/*.stories.tsx` i `stories/mocks/fixtures.ts`.
- Silnik przeglądu: `lekcja-07/silnik-przegladu/` (README: `prototype.js`, `comments.js`, `prototype.css`, `mostek.css`).
- Kod prototypu: `.ai/prototypes/epik-01/`. Wynik budowania (nie commitować): `packages/ui/.storybook/public/prototypes/epik-01/index.html` → podgląd w Storybooku pod `/prototypes/epik-01/index.html`.
- Zakres: tylko Epik 01 (s01–s12); E02 (rezerwacje, płatności) poza zakresem (L05).

## Stan etapów

| Etap | Stan |
|---|---|
| 0. Plan | zatwierdzony 2026-10-23 (P1–P5 jak rekomendowano, E1–E14 przyjęte) |
| 1. Szkielet i ścieżka bez błędów | **zakończony 2026-10-23** (PR #47) |
| 2. Stany, role, scenariusze | **zakończony 2026-10-23** (zadanie domowe, sekcja 12) |
| 3. Uczciwość i sprawdzenie | **zakończony 2026-10-23** (sekcja 13); wyniki w `evidence/results-*.txt` |

## Następny krok

Przegląd etapów 2 i 3 przez właściciela (komentarze w prototypie: Comment → Export for repository), potem decyzje o lukach z sekcji 13 (G13–G17 i pytania do specyfikacji). Wznowienie w nowej sesji: `cd .ai/prototypes/epik-01 && npx vite build` (wynik w `packages/ui/.storybook/public/prototypes/epik-01/`), serwer plików `python3 -m http.server 4175 -d packages/ui/.storybook/public`, sprawdzenie: `zsh .ai/prototypes/epik-01/evidence/run-all.sh` (około 10 minut) i osobno `walk-views.sh` (okna 1440/1280/320, kontrast, około 15 minut). Instrukcja dla użytkownika prototypu: `README.md` w tym katalogu.

---

## 1. Technologia i uruchomienie

- React 19 + TypeScript + Tailwind 4 budowane Vite, w `.ai/prototypes/epik-01/` (własny `vite.config.ts`, `index.html`, `src/`). Nie jest workspace'em npm i nie jest importowany przez aplikację.
- Komponenty z `@devmentor/ui` importowane po ścieżkach (`@devmentor/ui/components/mentors/OfferChecklist` itd.): `node_modules/@devmentor/ui` to symlink do `packages/ui`, więc bez kopiowania i bez wrappera. Style: `@import "tailwindcss"` + `@devmentor/ui/styles/tokens.css` + `theme.css` + `@source` na `packages/ui/src`; czcionki Geist z `@fontsource-variable/geist` (jak Storybook).
- Komponenty DS są sterowane propsami (`onSubmit`, `onSave` itd. zwracają wynik), więc „API” prototypu to moduł w pamięci (`src/sim/`) z fikcyjnymi danymi, zegarem demo i scenariuszami; nie ma `fetch`, MSW ani serwera.
- Routing: własny mały router na hashu (`#/…`, jak w szarym prototypie, działa z `file://` i pod Storybookiem), trasy jak w mapie (`/login`, `/mentor/slots`, `/m/marek-zielinski-k3x9q2`…); nawigacja produktu przez `renderLink` DS.
- Silnik przeglądu: kopia 4 plików z `lekcja-07/silnik-przegladu/` do `.ai/prototypes/epik-01/engine/` (prototyp samowystarczalny, silnik niezmieniany), import `comments.js`, `prototype.js`, `prototype.css`, `mostek.css`; `prototypeId = "epik-01"`; `<html data-prototype-id="epik-01" data-start-screen="s01">`; po pierwszym renderze `window.__PROTOTYPE_START__()`.
- Uruchomienie: `cd .ai/prototypes/epik-01 && npx vite build` (wynik do `packages/ui/.storybook/public/prototypes/epik-01/`, `base: "./"`, jeden `index.html` + assety), `npx vite` dla pracy (dev, osobny port 5174). Podgląd: `npm run storybook` → `http://localhost:6006/prototypes/epik-01/index.html`. Skrypty w `package.json` prototypu nie powstaną (bez nowego pliku `package.json`); komendy w README prototypu (etap 3).
- Konfiguracja repo do ruszenia dopiero po akceptacji (P1): wpis `packages/ui/.storybook/public/prototypes/` w `.gitignore` i wyłączenie tego folderu oraz `.ai/prototypes/epik-01/engine/` z ESLint (`globalIgnores`), jak w ćwiczeniu 2a.

### Pakiety npm do zatwierdzenia

**Nowych pakietów: 0.** Wszystko jest już w `node_modules` (hoisting z workspace'ów, nic nie instalujemy, `package.json` ani `package-lock.json` się nie zmieniają):

| Pakiet | Wersja (zainstalowana) | Po co | Instalacja |
|---|---|---|---|
| vite | 8.3.4 | build i dev prototypu | nie trzeba |
| react, react-dom | 19.3.0 | UI (tak samo jak DS) | nie trzeba |
| tailwindcss, @tailwindcss/vite | 4.3.3 | klasy tokenów DS | nie trzeba |
| @fontsource-variable/geist, geist-mono | 5.3.0 | czcionki DS | nie trzeba |
| @base-ui/react, class-variance-authority, lucide-react | 1.9.0 / 0.7.1 / 1.56.0 | zależności komponentów DS | nie trzeba |
| typescript | ^5 | JSX/TS | nie trzeba |

Nie potrzeba: `@vitejs/plugin-react` (nie ma go w `node_modules`; Vite 8 kompiluje JSX sam, ustawiam `jsx: automatic` w configu; tracimy tylko hot reload komponentów), routera, biblioteki stanu, testów nawigacji w Vitest (etap 3, istniejący `vitest`). Gdyby P1 odrzuciło „bez instalacji” albo etap 3 chciał `@vitejs/plugin-react`, poproszę osobno o `npm i -D @vitejs/plugin-react@<ver> -w @devmentor/ui` (nie zrobię tego bez zgody).

## 2. Kolejność budowy (etap 1: ścieżka od zaproszenia do profilu publicznego)

Szkielet (krok 0): vite config, router, silnik przeglądu + mostek do tokenów, pasek przeglądu (wybór ekranu s01–s12, przełącznik motywu jasny/ciemny, oznaczenie „Prototyp”, przełącznik roli c01, Reset), moduł `sim` (zegar demo: pt 2026-10-23 10:00 Europe/Warsaw, dane z mapy sekcja 3), `AppHeader`/`AccountMenu`/`RoleNav` zależne od roli.

| # | Ekran | Stan w etapie 1 | Po co na ścieżce |
|---|---|---|---|
| 1 | s03 Logowanie | s03.1, s03.2, s03.6 (+ zwrot na poprzednią stronę po L02) | admin wchodzi; wspólny wejściowy krok |
| 2 | s06 Zaproszenia | s06.1, s06.5, s06.6, s06.7 (zaproś anna.maj → link raz → Done) | start ścieżki (D11, D15) |
| 3 | s04 Rejestracja mentora | s04.1, s04.2, s04.9 (link otwiera się z panelu linku) | zaproszony mentor zakłada konto |
| 4 | s07 Panel mentora | s07.1 → s07.2 → s07.4/s07.5 (lista kontrolna rośnie z każdym krokiem) | centrum ścieżki |
| 5 | s08 Profil i ceny | s08.2, s08.1, s08.5, s08.6, s08.9 (zapis, link do udostępniania, opt-in) | #25-1, #28-1, #28-3 |
| 6 | s09 Terminy | s09.1, s09.2, s09.5, s09.6 (dodanie slotu ≥24 h, grupowanie wg dni) | #27-1 |
| 7 | s11 Strona mentora | s11.1, s11.2 (Book wyłączony z powodem, informacja o 24 h) | koniec ścieżki (#28-1, #25-3) |
| 8 | s10 Lista mentorów | s10.1 (mentor z nowej ścieżki jest na liście obok 3 stałych; mentee ląduje tu po logowaniu, L04) | potwierdza opt-in, bez filtrów |
| 9 | s01 Start, s05 Admin, s12 Brak dostępu | tylko stany domyślne: s01.1–s01.4, s05.1, s12.1–s12.3 (bramki jako przekierowanie na `/login`) | żeby nie było martwych linków |

Poza etapem 1 (domowe): s02 (rejestracja mentee, wszystkie stany), stany błędów/ładowania/pustych wszystkich ekranów, filtr i paginacja s10, usuwanie slotów (s09.10–s09.12), DST, bramki z komunikatami, s01.5/s01.6.

## 3. Kontrolki scenariuszy (pasek przeglądu, osobno od nawigacji produktu)

| Etap | Kontrolki |
|---|---|
| 1 | c01 rola (gość/mentee/mentor/admin, przełączanie bez wpisywania hasła), c22 szerokość (1280/320), Reset symulacji, przełącznik motywu (nie c-scenariusz), wybór ekranu |
| 2 (domowe) | c02 zaproszenie (ważne/użyte/wygasłe/unieważnione/nieznane), c03 użyte w międzyczasie, c04 e-mail zajęty, c05 błędne hasło, c06 za dużo prób, c07 sesja wygasła, c08 sieć/500, c09 wczytywanie, c10 lista zaproszeń, c11 ponowne zaproszenie, c12 link zgubiony, c13 stan oferty mentora, c14 opt-in, c15 brak slotów, c16 slot zarezerwowany, c20 lista publiczna (pusta/kilku/25/długie), c21 filtr stosu |
| 3 (domowe) | c17 zegar demo (+6 h/+24 h), c18 czas lokalny, c19 DST; ich działanie sprawdzone w teście nawigacji i w przeglądarce |

c11 i c12 są „wykonaj”, więc jako przyciski; c13 jako szybkie ustawienie stanu oferty (zastępuje klikanie całej ścieżki).

## 4. Konta demo (mapa, sekcja 3; domena `@example.com`, hasła fikcyjne ≥12 znaków, jawne na ekranie logowania przy podpowiedzi „Demo accounts”)

| Rola | Konto | E-mail | Hasło demo | Stan wyjściowy |
|---|---|---|---|---|
| mentee | Ola Wiśniewska | ola.wisniewska@example.com | ingress-1-28-upgrade | bez rezerwacji; po logowaniu `/mentors` |
| mentor | Marek Zieliński | marek.zielinski@example.com | helm-chart-rollback-2 | oferta gotowa, na liście, slug `marek-zielinski-k3x9q2`, 180/320 PLN, sloty z mapy; po logowaniu `/mentor` |
| admin | Oliwia Nowak | oliwia.nowak@example.com | demo-admin-passphrase-1 | założycielka; po logowaniu `/admin` |
| zaproszony (ścieżka etapu 1) | Anna Maj | anna.maj@example.com | wpisuje własne hasło (demo, nigdzie nie zapisywane) | zaproszenie pending do 2026-11-06, „nowy mentor” |

Mentorzy publiczni bez logowania: Kasia Lewandowska, Piotr Wójcik, Nina Kamińska (dane z mapy). Zaproszenia na liście admina: anna.maj (pending), marek.zielinski (used), jan.sowa (expired), tomasz.kowalczyk (revoked po c11). Na ekranie logowania, rejestracji i pasku widnieje „Prototyp: logowanie i zapis są symulacją, nic nie jest wysyłane ani zapisywane”.

## 5. Komponenty DS na ekran i luki DS

Wspólne dla wszystkich: `PageLayout`, `AppHeader`, `AccountMenu`, `RoleNav`.

| Ekran | Komponenty | Luki DS (mapa sekcja 5) i inne |
|---|---|---|
| s01 | `Item`/`ItemLink`, `Button`, `link-text`, `Skeleton` (s01.5) | G03 (brak `/` dla gościa, mentee, mentora: najprostsza wersja z `Item`, bez hero i kart, oznaczona w kodzie `// LUKA DS G03`), G07 (czy `AccountMenu`/`AppHeader` mają stan ładowania sesji: do sprawdzenia w etapie 1) |
| s02 | `CrudForm`, `Alert`, `Button`, `Spinner` | G06 (wariant „już zalogowany”) |
| s03 | `CrudForm`, `Alert`, `Button`, `Spinner`, `link-text` | G02 („Your session has ended” nad formularzem: `Alert` z tokenów), G06 |
| s04 | `Skeleton`, `CrudForm`, `Alert`, `link-text` | G06 (brak tokenu, zalogowany) |
| s05 | `Item`, `ItemLink`, `RoleNav` | brak (link „Users” poza zakresem, P4) |
| s06 | `CrudForm`, `DataTable`, `InvitationStatusBadge`, `InvitationLinkPanel`, `CopyField`, `Alert`, `ErrorMessage`, `LoadingMessage`, `EmptyState` | brak (status *Revoked* ma komponent) |
| s07 | `OfferChecklist`, `Card`, `CopyField`, `Badge`, `Skeleton`, `ErrorMessage` | `PendingBookingsNotice` celowo pominięty (L05) |
| s08 | `MentorProfileForm`, `CopyField`, `PriceList`, `Alert`, `Skeleton` | G04 (Switch czy Checkbox dla opt-in: P2) |
| s09 | `AddSlotForm`, `SlotTimeField`, `SlotList`, `DeleteSlotDialog`, `EmptyState`, `Alert`, `Skeleton`, `Popover` | G05 (brak siatki kalendarza; lista wg dni) |
| s10 | `MentorCard` (`TagList`, `PublicWorkLinks`, `PriceList`), `ResultCount`, `ActiveFilters`, `NativeSelect`, `Pagination`, `EmptyState`, `ErrorMessage`, `Skeleton` | brak |
| s11 | `MentorProfileHeader`, `PriceList`, `TagList`, `PublicWorkLinks`, `SlotList`, `Button` (wyłączony, powód tekstem), `EmptyState`, `ErrorMessage`, `Skeleton` | `SlotBookActions` nie (E02) |
| s12 | `ErrorMessage`/`Alert` + `link-text` | G01 (brak strony: najprostsza wersja z `ErrorMessage` + link do `/login`, oznaczona jako luka) |

Dodatkowe luki widoczne już teraz:
- **G08 (nowa, silnik przeglądu, nie DS)**: `lekcja-07/silnik-przegladu/prototype.css` i `mostek.css` mają literały kolorów, cienie (`--shadow-*`) i wartości zastępcze (`#15803d`, `#b45309`), czyli łamią `lint:tokens`, gdyby go uruchomić na prototypie. Pasek przeglądu to narzędzie przeglądu, nie produkt; proponuję mostek przepiąć na tokeny DS (tam gdzie istnieją) i literały zostawić tylko w pliku silnika, oznaczone (E10).
- **G09 (nowa)**: DS nie ma wzorca „pasek przeglądu / panel scenariuszy”. To nie część produktu, więc pasek składam z prymitywów (`Button`, `NativeSelect`, `Switch`, `Separator`) i klas silnika.
- Zasada „żadnych nowych kolorów/komponentów”: każde obejście w kodzie `// LUKA DS Gxx`, lista trafia do raportu.

---

## 6. Pytania do właściciela (max 5)

- **P1.** Czy zatwierdzasz podejście „0 nowych pakietów” (sekcja 1) oraz dwie zmiany konfiguracji repo jak w 2a: wpis `packages/ui/.storybook/public/prototypes/` w `.gitignore` i wyłączenie z ESLint `globalIgnores` tego folderu, `lekcja-07/` i `.ai/prototypes/epik-01/engine/`? W repo nie widać jeszcze folderu `public/prototypes/` ani tych wpisów (ćwiczenie 2a zostało zrobione inaczej albo w innej gałęzi?). Bez zgody nie ruszam `.gitignore` ani `eslint.config.mjs`.
- **P2.** G04: opt-in „Show me on the public list” jako `Checkbox` zapisywany z formularzem (spec Q15, zgodnie z A09 z 2a i regułami „If … then” DS), czy `Switch` (tabela komponentów)? Proponuję `Checkbox` (E7).
- **P3.** L13 (otwarte): zalogowany na `/login`, `/register`, `/register/mentor?token=`. Bez decyzji robię jak w 2a (A10): nie blokuję, notatka „A new login replaces the session”. Zgoda czy inaczej?
- **P4.** L16: czy `/admin/users` ma być ekranem prototypu? Proponuję: nie; na s05 link „Users” widoczny, ale nieaktywny z dopiskiem „Not in this prototype” (E9).
- **P5.** DST (c19, s09.8/s09.9): komponent `SlotTimeField` z DS już obsługuje luki i niejednoznaczność (testy jednostkowe), a w szarym prototypie A08 DST pominięto. Symulować w etapie 2/3 (proponuję: tak, bo jest w mapie i w DS), czy pominąć i oznaczyć „nie symulowane”?

## 7. Własne propozycje (najbardziej zachowawcze, odwracalne; do zatwierdzenia lub zmiany)

- **E1.** Zero nowych zależności; `@vitejs/plugin-react` pominięty (brak hot reload komponentów). Odwrócenie: jedna linia w configu po instalacji za zgodą.
- **E2.** Silnik przeglądu kopiowany do `.ai/prototypes/epik-01/engine/` bez zmian (nie importuję z `lekcja-07/`, bo ten folder to materiał lekcji i może zniknąć); aktualizacja = podmiana plików.
- **E3.** Router na hashu zamiast History API, żeby działało pod Storybookiem i z `file://` oraz z silnikiem przeglądu (ID ekranów jako kotwice `#s01…` nie kolidują: trasy produktu mają prefiks `#/`, ID ekranów to osobny mechanizm paska przeglądu).
- **E4.** Dane i stan w pamięci modułu `sim` z resetem; bez `localStorage` (komentarze silnika zapisują się w przeglądarce recenzenta, to osobny mechanizm silnika).
- **E5.** Przełącznik roli c01 loguje bez hasła (skrót w pasku przeglądu); formularz logowania działa równolegle na kontach demo z mapy. Skrót nie jest funkcją produktu.
- **E6.** Etap 1 pokazuje ścieżkę na koncie „Anna Maj” (zaproszenie pending z mapy) wzdłuż s06 → s04 → s07 → s08 → s09 → s11; Marek i pozostali mentorzy publiczni to dane stałe, a nowa mentorka dołącza do listy s10 po opt-in z ceną i slotem.
- **E7.** Opt-in jako `Checkbox` w `MentorProfileForm` (do P2); jeśli DS przyjmie `Switch`, zamiana to jedna linia.
- **E8.** Z `MentorProfileForm` i `AddSlotForm` korzystam takimi, jakie są (propsy `onSubmit` zwracają wynik symulacji); jeśli komponent nie ma miejsca na wymagany stan z mapy (np. ceny nieustawione s08.11), buduję najprostszy wariant z tokenów, oznaczam `// LUKA DS` i raportuję.
- **E9.** Linki poza zakresem E01 (E02, `/admin/users`, „My bookings”): ukryte albo nieaktywne z widocznym powodem; żadnych martwych kliknięć.
- **E10.** `mostek.css` przepięty na tokeny DS; literały zostają tylko w kopii `prototype.css` silnika, oznaczone jako G08.
- **E11.** Hasła demo wyświetlane jawnie na ekranie logowania w sekcji „Demo accounts”, bo są fikcyjne i podane w mapie; pola haseł nie wysyłają niczego i nic nie zapisują. Hasło nowej mentorki (s04) jest sprawdzane tylko pod kątem 12–128 znaków i nie jest przechowywane.
- **E12.** Zegar demo stały (pt 2026-10-23 10:00 Europe/Warsaw); w etapie 1 bez przesunięcia (c17 dopiero w etapie 3). Slot dodawany w etapie 1 musi mieć ≥24 h od „teraz”; błąd <24 h pokazuje komunikat jak w s09.7.
- **E13.** Mentor z linkiem po opt-in bez cen/slotów (L07): wyjaśnienie w liście kontrolnej, jak w A09 szarego prototypu; pokazane w etapie 2.
- **E14.** Notatki do ekranów (etap 3) w `.notes > .note` silnika: numery historii (#25–#28), co jest symulacją, czego prototyp nie rozstrzyga; dopisek „Prototyp”: widoczny w nagłówku każdego ekranu od etapu 1.

## 8. Reguły pracy (przypomnienie z promptu)

1. Tylko komponenty i tokeny DS; luki oznaczać `// LUKA DS` i raportować. 2. ID z mapy niezmienne. 3. Dane fikcyjne z briefu/mapy, zegar stały. 4. Płatność/e-mail/logowanie zewnętrzne to symulacje, napisane na ekranie. 5. Kontrolki scenariuszy w pasku przeglądu. 6. Każdy przycisk działa albo ma dopisek. 7. Reguły briefu/spec ważniejsze niż „zwykle”; bez funkcji spoza mapy. 8. Nie zmieniać kodu aplikacji ani DS, niczego nie usuwać; wynik budowania nie jest commitowany.


---

## 9. Etap 1: wykonane (2026-10-23)

**Zbudowane** (`.ai/prototypes/epik-01/`: `index.html`, `vite.config.ts`, `tsconfig.json`, `engine/`, `src/{main,shell,nav,chrome}.tsx`, `src/sim/store.ts`, `src/screens/{general,admin,mentor,public}.tsx`, `evidence/`):

- Szkielet: pasek przeglądu (oznaczenie Prototype, wybór ekranu s01–s12, c01 rola, c22 szerokość, Reset, motyw), silnik przeglądu podłączony (Clickable/Comment, Show hotspots, Presentation, Threads, Hide pins, Back, eksport), `prototypeId = epik-01`.
- Ekrany: s01 (s01.1–s01.4), s02 (tylko oznaczony placeholder „Not built in this stage”), s03 (s03.1–s03.3, s03.6, komunikat bramki, notatka A10), s04 (s04.1–s04.3, s04.5, s04.9), s05 (s05.1), s06 (s06.1, .5–.7, .9, .10 jako skutek uboczny logiki, e-mail z kontem = s06.11 w logice), s07 (s07.1, .2, .4, .5 wynikają ze stanu), s08 (s08.1, .2, .5–.7, .9–.10), s09 (s09.1, .2, .5–.7; odrzucenie <24 h, >60 dni, siatka 15 min, odstęp 50 min, duplikat), s10 (s10.1), s11 (s11.1–.4), s12 (s12.3, bramki 401/403 przechodzą na s03 wg L02).
- Bramki: gość i zła rola na `/mentor` i `/admin` → `/login` z komunikatem, po zalogowaniu powrót (L02, A01); po logowaniu bez powrotu: mentee `/mentors`, mentor `/mentor`, admin `/admin` (L04).
- Link do udostępniania na `/mentor` i `/mentor/profile` (po pierwszym zapisie), *Book* wyłączony z powodem tekstem, 24 h wprost na s10 i s11 (L05, L08, L14).

**Sprawdzone** (agent-browser, sesje izolowane, ekran 1280 px): `evidence/walk-stage1.sh` 39/39 (mysz i pola: ścieżka od zaproszenia do strony publicznej, bramki, role, lista publiczna, motyw ciemny, 320 px jako kontener), `evidence/walk-keyboard.sh` 15/15 (Tab, Shift+Tab nie testowany osobno, Enter, Space; ścieżka admin → zaproszenie → rejestracja → profil → slot), tryb komentarzy (dodanie wątku, pin, eksport dostępny), serwowanie przez Storybook (`npm run storybook`, `/prototypes/epik-01/index.html` = 200). 22 zrzuty w `evidence/`. `tsc`, `eslint .` (całe repo) i `npm run lint:tokens` (290 plików) bez błędów. Nie uruchamiane: `npm test`, `build`, `test:storybook`, integracyjne (zmiany poza zakresem testów; dotknięte tylko `.gitignore` i `eslint.config.mjs`).

**Odstępstwa od planu i założenia (do zatwierdzenia):**

- **E3b.** Router na hashu zastąpiony: silnik przeglądu sam używa `#sNN` (zapis w historii, `hashchange`), więc trasy produktu żyją w stanie React i w `sim`, a przejście = zdarzenie `prototype:navigate` z ID ekranu. Skutek: adres pokazuje ekran (`#s06`), nie trasę produktu; parametry (`slug`, `token`) są w pamięci.
- **E15.** Wynik budowania ma zasoby w podfolderze `dist/` (`assetsDir: "dist"`), bo `lint:tokens` skanuje `packages/ui/.storybook` i pomija foldery `dist`; zminifikowany Tailwind i biblioteki łamały bramkę (75 trafień). `index.html` zostaje pod `/prototypes/epik-01/index.html`. Skrypty (`scripts/check-tokens.mjs`) nie zmienione.
- **E16.** Podgląd wymaga serwera HTTP (moduły ES nie działają z `file://`), Storybook go zapewnia.
- **E17.** Sterowania prototypu poza paskiem: link „open this link as the mentor/visitor (simulated)” pod panelem zaproszenia i pod linkiem do udostępniania (symulują wklejenie linku w przeglądarce; DevMentor nie wysyła e-maili, D15). Dopisane jako „Prototype:” tekstem.
- **E18.** Dane Anny Maj, Marka i mentorów publicznych jak w mapie; terminy mentorów publicznych poza „najbliższym” (po jednym dodatkowym) są wymyślone tylko dla wypełnienia listy; hasło Anny podawane przy rejestracji nie jest przechowywane poza pamięcią karty (sprawdzana tylko długość 12–128).
- **E19.** Lista na `/mentors` w etapie 1 bez filtra i paginacji; lista terminów mentora bez usuwania (`DeleteSlotDialog`: etap 2).

**Luki DS i inne (do raportu):**

- G03 (s01) i G01 (s12) obejścia z tokenów, oznaczone `// LUKA DS` w kodzie; G02 (komunikat „Your session has ended”) dopiero w etapie 2; G05 lista wg dni.
- **Nowa G10:** `OfferChecklist` zawsze pokazuje link do udostępniania (`Done`) od pierwszej wizyty, także przed pierwszym zapisem profilu, wbrew L08 („od momentu zapisania profilu”) i A06 z szarego prototypu; w `/mentor/profile` link pokazuję dopiero po zapisie. Do decyzji: zmiana `OfferChecklist` w DS albo przyjęcie, że link działa od razu (zgodne ze spec U16 i U22).
- **Nowa G11:** `InvitationLinkPanel` nie ma akcji „otwórz link” (tylko `Done`); prototyp dodaje link tekstowy obok (E17).
- **Nowa G12:** `MentorProfileForm` po zapisie nie przenosi fokusu na komunikat „Profile saved.” (szary prototyp to robił); fokus zostaje na przycisku/body. Do zgłoszenia właścicielowi DS.
- **G09/G08:** pasek przeglądu z klas silnika i tokenów (`src/styles.css`), kopia silnika bez cieni, okrągłych pinów i literałów kolorów (mostek przepięty na tokeny).
- Kontrolka c22 ogranicza tylko szerokość kontenera: breakpointy Tailwinda reagują na okno przeglądarki, więc prawdziwe 320 px = zmiana okna (sprawdzenie w etapie 3).
- agent-browser: `find label … click` nie przełącza checkboxów Base UI (pole ukryte); w skryptach używam `find role checkbox click`. Kliknięcie etykiety przez DOM działa (nie błąd prototypu).

**Czego nie sprawdzono w etapie 1:** 320 i 1440 px prawdziwym oknem, kontrast w obu motywach poza dwoma zrzutami, Shift+Tab i Escape, czytnik ekranu, stany błędów/ładowania/puste poza wymienionymi, DST.

## 10. G10: zamknięta (2026-10-23)

Decyzja właściciela: zgodnie z L08 link do udostępniania pojawia się dopiero po zapisie profilu.

- Zmiana w DS: `packages/ui/src/components/mentors/OfferChecklist.tsx`. Krok „Share link” ma status `To do` (bez pola z linkiem, opis „Your link appears here once you save your profile.”), dopóki krok „Profile” nie jest `Done`; potem `Done` z `CopyField`, opis jak dotąd (zależny od tego, czy mentor jest rezerwowalny). Pozostałe kroki bez zmian.
- Testy i dokumentacja: `offer.test.tsx` (nowy mentor i nowy przypadek „profil zapisany, jeszcze nierezerwowalny”), story `NewMentor` (play), `Narrow` (profil zapisany, żeby pole linku nadal było widoczne), `OfferChecklist.mdx` (anatomia).
- Prototyp: bez zmian w kodzie (już pokazywał link po zapisie); przebudowany `npx vite build`.
- Weryfikacja w przeglądarce (agent-browser): `walk-stage1.sh` PASS=39 FAIL=0, `walk-keyboard.sh` PASS=15 FAIL=0. Zrzuty 07-mentor-overview-new.png (Share link: To do) i 12-mentor-overview-ready.png zrobione ponownie.
- G12 (fokus po zapisie profilu) nadal otwarta.

## 11. G12: zamknięta (2026-10-23)

Decyzja właściciela: po udanym zapisie fokus przechodzi na komunikat „Profile saved.” (`role="status"`).

- Zmiana w DS: `MentorProfileForm.tsx`: komunikat ma `id` i `tabIndex={-1}` (`outline-none`), a po sukcesie `pendingFocus` wskazuje na niego (istniejący mechanizm formularza). Tekst i strefa live bez zmian.
- Testy i dokumentacja: `MentorProfileForm.test.tsx` (fokus na statusie po zapisie), story `Save` (play sprawdza fokus), `MentorProfileForm.mdx` (wiersz o zapisie).
- Prototyp: przebudowany `npx vite build`; `walk-keyboard.sh` dostał dodatkową kontrolę K12b (fokus na „Profile saved.”): PASS=16 FAIL=0 (15 dotychczasowych + K12b); `walk-stage1.sh` PASS=39 FAIL=0. Zrzut 19-keyboard-profile-saved.png zrobiony ponownie.

## 12. Etap 2: wykonane (2026-10-23)

Zadanie domowe lekcji 7. Decyzje właściciela z 2026-10-23 wdrożone: **A07** (format e-maila sprawdzany przy zapraszaniu; „ma już konto” także przy rejestracji mentee i mentora), **A08** (czasy w Europe/Warsaw, DST s09.8 i s09.9 symulowane przez `SlotTimeField`), **A09** (opt-in = pole wyboru zapisywane z profilem; „Public list is on, but you are not visible yet. Missing: …” na `/mentor` i `/mentor/profile`), **A10** (zalogowany na /login, /register i linku zaproszenia nie jest blokowany, notatka „A new login replaces the session”). L01–L14 i decyzje etapu 1 bez zmian.

**Zbudowane** (`src/`): `sim/store.ts` (przepisany: scenariusze, zegar demo, błędy jednorazowe, limity, rezerwacja w międzyczasie), `load.ts` (stany ładowania i błędu z Try again), `scenarios.tsx` (panel kontrolek), `notes.ts` (notatki), ekrany s01–s12 dopełnione o wszystkie stany, bramka na s05 (brakowała w etapie 1), s02 jako pełny ekran (w etapie 1 był oznaczonym placeholderem), usuwanie slotów (`DeleteSlotDialog`), filtr stosu i paginacja na s10.

**Stany z mapy (sekcja 1b): 104 z 104 osiągalne i sprawdzone w przeglądarce** (tabela w sekcji 13). Stany s05.2, s05.3, s06.12, s07.8, s08.12, s09.16, s12.1, s12.2 to wg decyzji L02 przekierowanie na /login z komunikatem (nie osobna strona); s12.4 to /login z „Your session has ended”.

**Kontrolki scenariuszy** (panel „Scenario controls” pod paskiem przeglądu, osobno od nawigacji produktu): c01 rola (pasek główny), c02–c17, c19, c20, c21 (wszystkie wartości z mapy), c22 (stage 1). Dodane poza mapą, oznaczone jako takie: **x01–x03** (nieznany link mentora, nieznany adres, link rejestracji bez tokenu; bez nich s11.4, s12.3 i s04.10 nie mają jak być osiągnięte klikiem), trzecia wartość c15 „60 slots” (s09.14, s11.6), przycisk „End the session now” obok c07 (s03.7 od razu). **c18 (strefa czasowa widza) nie zbudowana**: A08 mówi, że czasy są w Europe/Warsaw, mapa nie wymaga c18 w etapie 2.

**Role i konta demo:** gość, Ola (mentee), Marek (mentor), Oliwia (admin), Anna Maj (zaproszona, rejestruje się własnym hasłem), nowo zarejestrowani (mentee przez s02, mentor przez s04); przełączanie c01 bez hasła albo logowaniem z formularza (hasła demo na ekranie logowania).

**Założenia dopisane w etapie 2 (do zatwierdzenia):**
- **E20.** Po rejestracji mentee (s02.7) ląduje na `/mentors`, jak po logowaniu (L04); mapa (U12) mówi `/`.
- **E21.** Ogólny komunikat konfliktu e-maila przy rejestracji mentee: „We could not create an account with this email. If it is yours, log in instead.” (U2: nie potwierdza istnienia konta); przy zapraszaniu i rejestracji mentora: „This address already has an account – log in.” (L11).
- **E22.** Limity: 5 nieudanych logowań na ten sam e-mail blokuje logowanie (429, także poprawnym hasłem, bez upływu czasu w prototypie); limity rejestracji tylko przez c06 (nie ma licznika).
- **E23.** c08 działa na **następne żądanie** (ładowanie ekranu albo zapis), potem wraca do „Succeeds”; c10 „Error” jest trwały do przełączenia.
- **E24.** c09 „Slow” wydłuża ładowania i zapisy do 3,5 s (inaczej „wysyłanie” i „ładowanie” trwają ułamek sekundy). Normalnie ekrany ładują się natychmiast (jeden takt).
- **E25.** c13 i c15 nadpisują profil/sloty mentora (sesja mentora, a bez niej Marka) do Resetu; c15 „Normal” przywraca sloty sprzed pierwszej zmiany. c16: wiersz zmienia się na „Booked” dopiero przy następnym wczytaniu ekranu terminów, żeby okno usuwania zdążyło pokazać powód.
- **E26.** Link zaproszenia pokazany raz znika także po opuszczeniu ekranu (nie wraca po powrocie).
- **E27.** Na `/login` dopisek „Forgot your password? Ask the founders to reset it. There is no reset page.” (spec: reset robi założyciel; L12) i na `/mentor/slots` komunikat o braku cen (L06): to teksty, nie nowe funkcje.
- **E28.** Przejście paskiem przeglądu (hash) na stronę chronioną jako gość kończy na /login (bramka działa tak samo jak kliknięcie w produkcie).
- **E29.** Trzech mentorów stałych + 22 wygenerowanych (fikcyjne imiona, bez ocen) dla c20 „25 mentors”; mentor „Aleksandra …” (120-znakowy nagłówek, 5 linków, 4 tagi, 60 slotów) i „Tomasz Kowalczyk” (bez nagłówka, tagów i linków) dla c20 „long values”.

**Trzy luki znane z etapu 1:** G10 i G12 były zamknięte w sekcjach 10 i 11 (nadal zamknięte: weryfikacja w skryptach: `walk-stage1` i `walk-keyboard` K12b). **G11** (`InvitationLinkPanel` bez akcji „otwórz link”) pozostaje: prototyp dokłada link tekstowy „open this link as the mentor (simulated)”. G01–G03, G05 pozostają jako `// LUKA DS` w kodzie (s12, s03/s12.4, s01, s09).

## 13. Etap 3: uczciwość i sprawdzenie (2026-10-23)

### Co uruchomiono

Skrypty w `evidence/` (agent-browser, sesje izolowane, serwer plików na porcie 4175; mysz i klawiatura jak w etapie 1). Każdy zapisuje `results-*.txt`; `run-all.sh` uruchamia wszystkie poza `walk-views.sh`.

| Skrypt | Zakres | Kontroli | Wynik |
|---|---|---|---|
| `walk-auth.sh` | s01, s02, s03, s05, s12, bramki, c01, c04–c09 | 71 | PASS=71 FAIL=0 |
| `walk-invite.sh` | s04, s06, c02, c03, c04, c06, c08–c12 | 63 | PASS=63 FAIL=0 |
| `walk-mentor.sh` | s07, s08, s09, c07–c09, c13–c17, c19 | 89 | PASS=89 FAIL=0 |
| `walk-public.sh` | s10, s11, c08, c09, c13, c15, c20, c21, role | 70 | PASS=70 FAIL=0 |
| `walk-review.sh` | notatki, tryb Comment, eksport, mapa ekranów, Back, prezentacja | 87 | PASS=87 FAIL=0 |
| `walk-keys.sh` | klawiatura (Tab, Shift+Tab, Enter, Space, Escape, okno dialogowe) | 15 | PASS=15 FAIL=0 |
| `walk-views.sh` | okna 1440/1280/320 px, jasny i ciemny motyw, kontrast | 61 | PASS=61 FAIL=0 |
| `walk-stage1.sh`, `walk-keyboard.sh` | etap 1 (ścieżka bez błędów, klawiatura), powtórzone na etapie 2 | 39 + 16 | PASS=39, PASS=16, FAIL=0 |
| **Razem** | | **511** | **511 passed, 0 failed** |

Zrzuty: 139 plików PNG w `evidence/` (etap 1: 01–19 odświeżone przy ponownym uruchomieniu, etap 2/3: 20–160), przykładowy eksport komentarzy w `evidence/exports/`.

### Tabela weryfikacji (stany z mapy, sekcja 1b)

„passed” = stan osiągnięty zgodnie z kolumną „jak” i sprawdzony skryptem w przeglądarce (nazwa kontroli w wyniku skryptu zaczyna się od ID stanu). Nic nie jest „passed” bez uruchomienia.

| Ekran | Stany | Jak osiągnięte | Skrypt | Wynik |
|---|---|---|---|---|
| s01 | .1 .2 .3 .4 | c01 rola, wejście na ekran z paska | walk-auth | passed |
| s01 | .5 ładowanie sesji, .6 błąd sesji | c09 „Slow”; c08 „Network error” + Try again | walk-auth | passed |
| s02 | .1 .2 .3 .4 .5 .6 .7 .8 | formularz; c09; c04 i istniejący e-mail; c06; c08; zalogowany na /register | walk-auth | passed |
| s03 | .1 .2 .3 .4 .5 .6 .7 .8 | formularz; c09; c05 i błędne hasło; 5 błędnych prób i c06; c08; role admin/mentee/mentor; c07 „now”; zalogowany na /login | walk-auth | passed |
| s04 | .1 .2 .3 .4 .5 .6 .7 .8 .9 .10 .11 | c09 + c02 „Valid”; c02 used/expired/revoked/unknown (identyczny komunikat); c03; walidacja; c04 i konto mentee na ten adres; c06; c08; x03; zalogowany | walk-invite | passed |
| s05 | .1, .2, .3 | admin; mentee/mentor i gość: przekierowanie na /login (L02) | walk-auth | passed |
| s06 | .1 .2 .3 .4 .5 .6 .7 .8 .9 .10 .11 .12 | lista; c09; c10 empty/error; c08; zaproszenie (Saving…); link raz + Done + c12; błąd wysyłki; walidacja; zaproszenie Anny drugi raz i c11; e-mail Oli; nie-admin | walk-invite, walk-auth | passed |
| s07 | .1 .2 .3 .4 .5 .6 .7 .8 | c13 (5 wartości); c09; c08 500 + Try again; admin na /mentor | walk-mentor, walk-auth | passed |
| s08 | .1 .2 .3 .4 .5 .6 .7 .8 .9 .10 .11 .12 | Marek; c13 „New mentor”; c09; c08; zapis; walidacja (nagłówek, cena 5, link http); opt-in/opt-out z komunikatem A09; ceny wyczyszczone; admin | walk-mentor, walk-auth | passed |
| s09 | .1 .2 .3 .4 .5 .6 .7 .8 .9 .10 .11 .12 .13 .14 .15 .16 | Marek; c15 None/60; c09; c08; dodanie; 5 odrzuceń (<24 h, >60 dni, siatka, duplikat, odstęp); c19 gap i ambiguous; usuwanie; c16; c13 „soon”; c13 „new”; mentee/admin | walk-mentor, walk-auth | passed |
| s10 | .1 .2 .3 .4 .5 .6 .7 .8 | c20 few/empty/25/long; c21 TypeScript/React (z pola Stack)/No results; c09; c08; role | walk-public | passed |
| s11 | .1 .2 .3 .4 .5 .6 .7 .8 | Marek; c15 None; x01; c20 long (Tomasz, Aleksandra); c09; c08 | walk-public | passed |
| s12 | .1 .2 .3 .4 | bramki (przekierowanie na /login z komunikatem, L02); x02; c07 „next save” + powrót po logowaniu (L03) | walk-auth | passed |

**104 z 104 stanów: passed.** Odstępstwa od brzmienia w mapie (stan jest, tekst inny): przycisk wysyłania pokazuje „Saving…” zamiast „Logging in…” / „Inviting…” / „Adding…” (CrudForm i `AddSlotForm` mają jedną etykietę; „Adding…” jest, „Saving…” zamiast „Logging in…”/„Inviting…”: luka G16); s12.1/s12.2/s05.2/s05.3 to /login z komunikatem, nie strona z błędem (decyzja L02).

### Kontrolki scenariuszy

| Kontrolka | Wynik |
|---|---|
| c01–c17, c19, c20, c21 (wszystkie wartości z mapy; c06 trzy wartości; c19 obie) | passed |
| c21: wartości Python i AI agents osobno | not-run (ta sama ścieżka kodu co TypeScript i React) |
| c22 szerokość kontenera 320 | passed w etapie 1 (`walk-stage1`), w etapie 3 sprawdzone prawdziwym oknem zamiast tego |
| c18 strefa czasowa widza | not-run: kontrolka nie zbudowana (A08: czasy w Europe/Warsaw) |
| c08 zmieniana klawiaturą (natywny `<select>`) | not-run: agent-browser nie zmienia wartości pola przez klawisze (zmiana myszą: passed) |

### Okna, motywy, klawiatura, komentarze

| Obszar | Wynik |
|---|---|
| Okna 1440, 1280 i 320 px (prawdziwy rozmiar okna), 12 ekranów: zawartość mieści się w oknie | passed (tabela zaproszeń na 320 przewija się we własnym kontenerze, zob. G13) |
| Motyw jasny i ciemny, 12 ekranów × 2: przybliżony kontrast tekstu WCAG AA (skrypt `contrast.js`, canvas) | passed (bez tekstu poniżej progu); to nie audyt: nie mierzy stanów hover/focus, obrazów, półprzezroczystości |
| Klawiatura: Tab, Shift+Tab, Enter, Space, Escape; okno usuwania (fokus na Keep slot, pułapka fokusu, Escape zwraca fokus); fokus po błędzie; stage-1 K1–K14 | passed |
| Notatki do ekranów: 12 ekranów, 3 pola, numery #25–#28 | passed |
| Tryb Comment: komentarz na s03, s06, s09, s10, s11 przypina się do ID własnego ekranu; Threads grupuje wg ekranów; pin pojawia się po wejściu na ekran | passed |
| Eksport „Export for repository”: plik się ładuje jako JS, `version: 2`, `prototypeId: epik-01`, każdy wątek ma ID ekranu z mapy; „Export Markdown” grupuje wg ekranów | passed (próbka w `evidence/exports/`; `engine/comments.js` pozostaje pusty) |
| Mapa ekranów (12 linków), Back, tryb prezentacji | passed |
| Czytnik ekranu (VoiceOver/NVDA) | not-run (brak narzędzia w tej sesji) |
| Dotyk i prawdziwe urządzenie 320 px | not-run (tylko Chrome na komputerze z oknem 320 px) |
| Firefox, Safari | not-run |
| Testy nawigacji w Vitest | not-run: zamiast nich skrypty przeglądarkowe (prototyp poza workspace'ami i poza pokryciem 100%) |
| Storybook serwuje `/prototypes/epik-01/index.html` | passed w etapie 1; w etapie 3 sprawdzano przez `python3 -m http.server` (te same pliki statyczne), `npm run storybook` nie uruchamiany ponownie |

### Luki w design systemie i silniku, które wyszły przy etapie 2/3

- **G13 (DS, DataTable):** na 320 px kolumny Status i daty na liście zaproszeń są poza widokiem (przewijanie poziome w kontenerze, bez wskazówki); najważniejsza informacja (status) jest niewidoczna.
- **G14 (DS, SlotList):** na 320 px opis wiersza slotu („Not bookable – starts too soon · Europe/Warsaw, UTC+2”) jest ucięty wielokropkiem.
- **G15 (DS, CrudForm):** błąd pola, który znika przy opuszczeniu pola, przesuwa przycisk wysyłania między naciśnięciem a puszczeniem myszy; pierwsze kliknięcie „Create account” po błędzie konfliktu było ignorowane (powtarzalne w agent-browser). Skrypty używają Enter.
- **G16 (DS, CrudForm):** etykieta wysyłania to zawsze „Saving…”; mapa wymaga „Logging in…”, „Inviting…”. Brak propsu na etykietę trwającej akcji.
- **G17 (silnik przeglądu):** React renderuje tylko bieżący ekran, więc komentarze innych ekranów są w panelu Threads jako „Orphaned” do czasu wejścia na ich ekran; ich ID ekranu w eksporcie jest poprawny. Piny przerysowuje zdarzenie `resize` wysyłane po renderze ekranu. Tryb Comment wyłącza nawigację produktu (żeby wejść na s11, przełącz na Clickable). Zakotwiczenie komentarza zależy od stanu ekranu (np. błąd w formularzu zmienia ścieżkę elementu).
- **G18 (DS, CrudForm):** brak propsu z wartościami początkowymi, więc po „Your session has ended” nie da się przywrócić e-maila w formularzu logowania (Q4). Decyzja właściciela: zapisać jako lukę, bez zmiany `packages/ui` w tym PR.
- G01–G03, G05, G11 jak wyżej (nadal otwarte).

### Pytania do specyfikacji (wyszły przy budowie)

1. Po rejestracji mentee: `/` (U12) czy `/mentors` (L04)? Prototyp: `/mentors` (E20).
2. Co widzi mentor, gdy slot staje się „starts too soon” w trakcie dnia (zegar c17 +24 h). **Zatwierdzone (właściciel):** przeszłe sloty zostają na liście oznaczone „Past: this time has passed” bez przycisku Delete (prototyp; `walk-mentor.sh` sprawdza).
3. Czy blokada logowania po 5 próbach (U4) ma blokować także poprawne hasło do końca okna 15 minut (prototyp: tak). **Zatwierdzone:** tak, z czasem ponowienia w komunikacie (15 minut).
4. L03: czy po „Your session has ended” wpisane dane formularza mają być odtworzone? **Zatwierdzone:** tak, bez haseł; wymaga propsu w `CrudForm`, więc zapisane jako G18.
5. Treść błędu przy konflikcie e-maila przy rejestracji mentee (U2 vs A07): **zatwierdzone** (E21).

### Weryfikacja bram repozytorium (2026-10-23)

| Brama | Wynik |
|---|---|
| `npm run lint` | bez błędów |
| `npm run typecheck` | bez błędów (prototyp: `tsc --noEmit -p .ai/prototypes/epik-01` też) |
| `npm run test:coverage` | 100% (statements 1099/1099, branches 880/880, functions 292/292, lines 966/966) |
| `npm run lint:tokens` | 290 plików, bez wartości poza tokenami (wynik budowania prototypu nie łamie bramki) |
| `npm run docs:design-system:check` | aktualne |
| `npm run build`, `build-storybook`, `test:storybook`, `test:integration` | not-run: `packages/ui`, `packages/app`, `core` i `db` nie zostały zmienione w etapach 2 i 3 (zmiany wyłącznie w `.ai/prototypes/epik-01/`) |

Dotknięte pliki: tylko `.ai/prototypes/epik-01/` (kod, `README.md`, `POSTEP.md`, `evidence/`). `engine/` bez zmian, `engine/comments.js` pusty. Zrzuty 01–19 z etapu 1 zostały nadpisane przy ponownym uruchomieniu skryptów etapu 1 na UI z etapu 2.
