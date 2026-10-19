# POSTĘP: design system DevMentor (Storybook)

Plik roboczy zadania z `lekcja-06/prompt-storybook.md`. Nowa sesja: przeczytaj prompt i ten plik, kontynuuj od „Następny krok”.

## Stan etapów

| Etap | Stan |
|---|---|
| 0. Inwentaryzacja i plan | zakończony 2026-10-19 – decyzje właściciela zapisane niżej |
| 1. Fundamenty | zakończony 2026-10-19 – F1 wdrożone, F2–F6 zapisane; czeka na „dalej” |
| 2. Komponenty bazowe | w toku – partie 1 (1710f15) i 2 zakończone, B26–B33 rozstrzygnięte; czeka na „dalej” do partii 3 |
| 3. Komponenty produktu, wzorce, ekrany | nie rozpoczęty |
| 4. Strony, które uczą | nie rozpoczęty |
| 5. Sprawdzenie i raport | nie rozpoczęty |

## Następny krok

Decyzje B26–B33 podjęte (niżej). Po commicie partii 2 przez koordynatora i „dalej” → partia 3: Card, Badge, Alert, Avatar, Item, link w treści (B22) + poprawki lint:tokens w card/alert/badge (B20, B21). Te same zasady: CLI bez nadpisywania, `git show HEAD:<plik>`, nigdy `git stash`, kontrola `package.json`/lockfile, 13 sekcji, macierz stanów, testy play.
Nic z partii 2 nie jest zacommitowane – commit robi właściciel.

## Zatwierdzone decyzje (źródła: `lekcja-06/referencje.md`, `lekcja-06/tokeny.md`)

1. Charakter: rzeczowy, czytelny, ciepły, bezpośredni, spokojny. Antycharakter: generyczny, hałaśliwy, kursowy, oceniający.
2. Gęste listy „tytuł + jedna linia metadanych”, separatory 1 px zamiast kart z cieniem, bez ramki w ramce (R01.1, R01.3, P3, T9, T12).
3. Monospace tylko dla kodu, ścieżek, plików, wersji (R01.2, P2).
4. Ciepłe szarości stone; akcent teal-800 / teal-400 (`--primary`) tylko na jednym elemencie ekranu: status + następna akcja; cena widoczna przed polem pytania (R01.4, R01.5, P4, P5, K3).
5. Sesja: strumień wiadomości + pole pisania na dole, Enter wysyła, Shift+Enter nowa linia, autor i godzina przy grupie, bez animacji wejścia, bez obecności/reakcji/liczników (R02.1–R02.3, P6–P9, K1, K4).
6. Bez dźwięków i liczników, jeden wskaźnik zdarzeń rezerwacji; bez emoji w UI; krótka nawigacja ról, panel kontekstu sesji (R02.4–R02.6, P10–P12, D15).
7. Antyreferencje A01–A05: generyczny wygląd AI (gradienty, szkło, iskierki, duże zaokrąglenia, poświata, hero + 3 karty, domyślny shadcn), kurs/ścieżka, oceny, subskrypcja/community, „X lat doświadczenia” i liczniki hype.
8. Konflikty: K1 gęstość zależy od rodzaju ekranu; K2 żadnego koloru ze Slacka (bez fioletu); K3 hierarchia przez jeden akcent; K4 czat tylko w widoku sesji.
9. Tokeny T1–T16: `--radius` 6 px, max `xl`, pełne koło tylko awatar; odstępy 8/16/16/32 (`--space-in-group`, `--space-between-groups`, `--space-panel`, `--space-section`); tokeny komponentów `--list-row-py/px`, `--message-group-gap`, `--message-gap`; `--input` stone-500, `--ring` neutralny; `--destructive` red-800; separatory < 3:1 jako dekoracja (T5); Badge `default` nie dla statusów (T10); linki w treści `foreground` + podkreślenie (T11); bez tokenów cieni i czasu animacji.
10. Ciemne wartości zaprojektowane i policzone (T15), ale tryb ciemny jest luką (brak przełącznika w produkcie).

## Inwentaryzacja repozytorium (stan 2026-10-19)

- npm 10.9.2 workspaces, Node 22.17; Next.js 16.4.0, React 19.3.0, Tailwind 4.3.3 (CSS-first, `@theme inline`), Vite 8.3.4 (przez Vitest 5), shadcn CLI 4.21.4, `@base-ui/react` 1.9.0, `lucide-react`, `cn` 0.4 (merge klas).
- Storybook: brak. Pliki `*.stories.*`: brak. `packages/ui/.storybook`: brak.
- `packages/ui`: 9 prymitywów shadcn base-nova (alert, badge, button, card, input, label, native-select, spinner, table), bloki panelu `backend/` (CrudForm, DataTable, feedback: LoadingMessage, ErrorMessage, EmptyState, apiCall). Eksporty po ścieżkach (`components/ui/*`, `backend/*`, `backend/api/*`, `lib/utils`); brak eksportu CSS.
- Tokeny: domyślne shadcn neutral (`:root`, `.dark`) w `packages/app/src/app/globals.css`; `@custom-variant dark (&:is(.dark *))`; `@source "../../../ui/src"`. `components.json` wskazuje ten plik jako `tailwind.css`.
- Fonty: Geist + Geist Mono przez `next/font/google` w `layout.tsx` (zmienne `--font-geist-sans/mono`).
- Prymitywy zawierają wartości arbitralne (`rounded-[min(var(--radius-md),10px)]`, `text-[0.8rem]`, `hover:bg-[color-mix(...)]`) – łamią zasadę 3 promptu.
- `packages/app/src/app/page.tsx` (strona główna) używa `bg-slate-950`, `text-cyan-400`, `text-white`, „Grow with a mentor who knows the way” – generyczny wygląd (A01) i ton kursowy (A02); poza katalogiem design systemu.
- Testy: Vitest projects (core, db, scripts, ui-jsdom), 100% pokrycia dla `packages/ui/src/**`, wykluczone `components/ui/**`. CI: lint, typecheck, build, test:coverage, integracyjne, migracje, Docker. Brama w `.ai/agentic.config.json` = CI.
- ESLint: `ui` nie importuje core/db/app/@mikro-orm. Brak ignorowania `storybook-static`.

## Plan (propozycja, czeka na decyzje)

### Technika
- Pakiet: `packages/ui` (`@devmentor/ui`); Storybook w `packages/ui/.storybook`.
- Storybook 10.6.2, framework `@storybook/react-vite` (S2).
- Dodatki: `@storybook/addon-docs` + `remark-gfm`, `@storybook/addon-a11y` (`a11y: { test: 'error' }`), `@storybook/addon-vitest` + `@vitest/browser-playwright` + `playwright` (Chromium), `@tailwindcss/vite`; przełącznik motywu własny (bez addon-themes); MSW (`msw`, `msw-storybook-addon`) dopiero w etapie 3 (S3).
- Skrypty (root → workspace ui): `storybook`, `build-storybook`, `test:storybook` (oba motywy), `lint:tokens` (S6).

### Komponenty bazowe (shadcn base-nova przez CLI, potem dopasowane do tokenów – S8)
button (+ wariant link = akcja tekstowa), link w treści (T11), input, textarea, native-select (istnieje; S12), checkbox, radio-group, switch, label, field, card, badge, avatar, alert, dialog, alert-dialog, dropdown-menu, popover, tooltip, tabs, skeleton, spinner (istnieje), table (istnieje), item (wiersz listy, S11), separator, input-group, kbd. Bloki panelu (istniejące): CrudForm, DataTable, LoadingMessage, ErrorMessage, EmptyState. Toast: nie (S10).

### Komponenty produktu
- E01 `mentors`: MentorCard, MentorProfileHeader, PriceList (+ `formatPrice` w `lib/`), TagList, PublicWorkLinks, OfferChecklist, InvitationLinkPanel, InvitationStatusBadge; `availability`: SlotList, SlotRow, SlotTimeField (podgląd strefy/DST); `auth`: AccountMenu.
- E02 `bookings`: BookingSummary, QuestionField (licznik 2000), BookingStatus (wszystkie stany maszyny), BookingRow, MentorBookingRow, AcceptDeadline, DeclineBookingDialog (powód ≤ 280), PaymentPending.
- E03: nie budujemy (P3) – tylko „What is missing”.

### Wzorce
Formularz, lista z filtrami, widok szczegółów, potwierdzenie usunięcia; z backlogu: status i następna akcja, termin z odliczaniem, czas ze strefą (DST), kwota PLN, płatność i oczekiwanie na potwierdzenie, checklista „do rezerwowalności”, link pokazany raz (kopiuj).

### Menu Storybooka
Design system (Start here, Components, How to choose, Usage and accessibility, Content, What to avoid, What is missing, Contributing, Epics/E01–E02) · Foundations (Color, Typography, Spacing and layout, Shape and depth, Motion, Icons, Themes) · Primitives · Product (E01, E02 – komponenty i Screens) · Patterns.
Szacunek (bez E03): ~42 strony MDX, ~380–430 stories, ~70 testów interakcji. Stories w `packages/ui/stories/` (S5).

## Propozycje do decyzji (S1–S21)

Decyzje właściciela (Arkadiusz) z 2026-10-19.

| # | Propozycja | Decyzja |
|---|---|---|
| S1 | Tokeny w `packages/ui/src/styles/` (tokens.css + theme.css), eksport `./styles/*`, `globals.css` importuje je; przeniesienie wartości z `globals.css`; `components.json` → nowy plik CSS | przyjęte |
| S2 | Storybook 10.6.2 + `@storybook/react-vite`, konfiguracja ręczna bez `storybook init` | przyjęte |
| S3 | Zestaw dodatków jak w planie; własny przełącznik motywu na `<html>`; MSW w etapie 3 | przyjęte |
| S4 | Fonty Geist z pakietów npm (`@fontsource-variable/geist`, `-mono`) w ui dla Storybooka; aplikacja zostaje przy `next/font` | przyjęte |
| S5 | Stories obok komponentu w `src/`, `**/*.stories.tsx` dopisane do `coverage.exclude`; testy stories w osobnej konfiguracji Vitest poza `test:coverage` (alternatywa: katalog `packages/ui/stories/`) | zmienione: stories w `packages/ui/stories/`, bez poszerzania `coverage.exclude`; osobna konfiguracja Vitest i `test:storybook` poza `test:coverage` |
| S6 | Skrypty root `storybook`, `build-storybook`, `test:storybook`, `lint:tokens`; skrypt tokenów w `scripts/check-tokens.mjs` z testami 100% | przyjęte |
| S7 | Nowy job CI „Storybook” + wpis w bramie walidacji i SDLC.md (osobna decyzja) | przyjęte, odłożone do etapu 5 |
| S8 | Prymitywy: dodawane CLI, potem dopasowywane do tokenów; doprecyzowanie `packages/ui/AGENTS.md`; wykluczenie z pokrycia zostaje | przyjęte |
| S9 | Skrypt tokenów sprawdza `packages/ui/src` i `.storybook`; strona główna aplikacji tylko do „What is missing” + osobne zgłoszenie | przyjęte |
| S10 | Bez toasta w 1.0 (brak potrzeby w specyfikacjach; sonner ciągnie `next-themes`) | przyjęte |
| S11 | Wiersz gęstej listy = shadcn `item`; pusty stan = istniejący `EmptyState` (bez shadcn `empty`) | przyjęte |
| S12 | Select = istniejący `native-select`; bez Base UI `select`/`combobox` do czasu potrzeby | przyjęte |
| S13 | E03 bez specyfikacji: komponenty i ekrany jako oznaczone propozycje; #35 (no-show) tylko w „What is missing” (Q03) | ODRZUCONE: E03 (#33–#36) tylko w „What is missing”, bez komponentów i ekranów |
| S14 | E04 (parked): bez strony epiku, wpis w „What is missing” | przyjęte |
| S15 | Spec `.ai/specs/2026-10-19-design-system-storybook.md` i log `.ai/runs/…` na starcie etapu 1; POSTEP.md po polsku | przyjęte |
| S16 | Przełącznik motywu tylko w Storybooku; aplikacja bez przełącznika (T15, zasada 11) | przyjęte |
| S17 | Odstępy znaczeniowe jako klasy Tailwinda (`gap-in-group`, `p-panel`, `py-list-row`…) przez `@theme`; sprawdzić, czy `cn` ich nie zlewa błędnie | przyjęte; ryzyko `cn` sprawdzić w etapie 1 |
| S18 | Branding „DevMentor” w managerze; `disableTelemetry`, `disableWhatsNewNotifications`, bez addon-onboarding | przyjęte |
| S19 | Plik dla agentów w `.ai/docs/design-system.md` (konwencja repo), link w `AGENTS.md` i `packages/ui/AGENTS.md` | przyjęte |
| S20 | Design system obejmuje wszystkie ekrany (publiczne, mentee, mentor, admin); zmiana zdania „Tailwind dla stron frontowych, shadcn dla admina” w `AGENTS.md` i w sekcji UI/UX specyfikacji E01 | przyjęte |
| S21 | Reguła „DataTable dla każdej listy” zawężona do list tabelarycznych (admin); listy produktu (rezerwacje, sloty) = gęsta lista na `item` (R01.1) | przyjęte |

## Odpowiedzi na pytania P1–P5 (Arkadiusz, 2026-10-19)

- P1. Ciemny motyw jest motywem produktu w Storybooku i w testach dostępności (oba motywy); w aplikacji na razie bez przełącznika (S16).
- P2. Geist + Geist Mono przyjęte jako decyzja. Role: nagłówek strony text-2xl/600, sekcji text-lg/600, tekst i etykieta text-sm (14 px, etykieta 500), metadane text-xs, liczby `tabular-nums`, kod mono text-sm.
- P3. Odrzucone budowanie E03: brak specyfikacji, więc E03 (#33–#36) tylko w „What is missing”.
- P4. Wysokość kontrolek 32 px na desktopie, 40 px przy wskaźniku zgrubnym (`pointer: coarse`, dotyk).
- P5. Ruch i ton: zaproponuję jako oznaczone propozycje do późniejszego zatwierdzenia.

## Otwarte pytania

Brak.

## Pakiety (etap 1 – zatwierdzone i zainstalowane 2026-10-19)

Wszystkie jako devDependencies `@devmentor/ui` (Storybook, testy i fonty dotyczą tylko pakietu ui), wersje dokładne:

```
npm install -D -w @devmentor/ui storybook@10.6.2 @storybook/react-vite@10.6.2 @storybook/addon-docs@10.6.2 @storybook/addon-a11y@10.6.2 @storybook/addon-vitest@10.6.2 @vitest/browser@5.0.4 @vitest/browser-playwright@5.0.4 playwright@1.64.1 @tailwindcss/vite@4.3.3 tailwindcss@4.3.3 remark-gfm@4.0.1 @fontsource-variable/geist@5.3.0 @fontsource-variable/geist-mono@5.3.0
npx playwright install chromium
```

- `@vitest/browser*` 5.0.4, nie 5.0.5: peer wymaga dokładnie tej wersji Vitest co w repo (5.0.4).
- Odłożone do etapu 3 (osobna zgoda): `msw@3.0.3`, `msw-storybook-addon@3.0.3`.
- Nie instalujemy: `@storybook/addon-onboarding`, `@storybook/addon-themes`, `sonner`, `next-themes`, `eslint-plugin-storybook`.

Zainstalowane dokładnie te wersje (przypięte bez `^`). Uwagi:
- Jedno polecenie `npm install` z 13 pakietami wywracało npm (ERESOLVE na `react-dom`, potem błąd arborist `edgesOut`); zainstalowane pojedynczo, te same wersje.
- Dodany `peerDependencies.react-dom: 19.3.0` w `@devmentor/ui` (był już w drzewie przez app; Storybook wymaga go jako peer). Żaden pakiet spoza listy, żadna istniejąca wersja w lockfile się nie zmieniła (196 nowych wpisów).
- `npm audit`: 10 „high” – wszystkie istniały przed instalacją (braces/micromatch przez shadcn, eslint-config-next, awilix, ts-morph).

## Etap 1 – wynik (2026-10-19)

### Co powstało
- `src/styles/tokens.css` – 3 warstwy (raw `--raw-*`, znaczeniowe shadcn + odstępy, komponentowe), jasny (`:root, .light`) i ciemny (`.dark`), źródło przy każdym tokenie; `--control-height` 32 px / 40 px przy `pointer: coarse` (P4).
- `src/styles/theme.css` – `@theme inline`, klasy `gap-in-group`, `gap-between-groups`, `p-panel`, `gap-section`, `py-list-row`, `px-list-row`, `gap-message-group`, `gap-message`, `h-control`, role `type-page-title|section-title|body|label|meta|code`.
- `packages/app/src/app/globals.css` importuje oba pliki (`@devmentor/ui/styles/*`, nowy eksport), `@source` zostaje; wartości shadcn neutral usunięte z app (przeniesione zgodnie z S1). `components.json` → `src/styles/tokens.css`, `baseColor: stone` (T1).
- `src/lib/utils.ts` – `cn` z `cn/config` zna nowe klasy (S17: bez tego `cn("gap-2","gap-in-group")` zostawiał obie – ryzyko potwierdzone i naprawione, test `utils.test.ts`).
- Storybook 10.6.2 w `.storybook/` (react-vite, docs + remark-gfm, a11y `test: 'error'`, vitest), branding „DevMentor design system”, tytuł karty „… ⋅ DevMentor”, telemetria, „what's new” i checklisty onboardingu wyłączone. Przełącznik motywu w toolbarze ustawia klasę `dark` i `data-theme` na `<html>` (zasada 9). Viewporty 320/768/1440.
- Foundations (MDX + stories w `stories/foundations/`): Color (role + zmierzona tabela kontrastu w obu motywach), Typography, Spacing and layout, Shape and depth, Motion (propozycje P5), Icons, Themes. Bloki dokumentacji w `.storybook/blocks/`.
- `vitest.storybook.config.mts` – projekty `storybook-light` i `storybook-dark` (Chromium, headless).
- `scripts/check-tokens.mjs` (+ testy, 100%), skrypty root: `storybook`, `build-storybook`, `test:storybook`, `lint:tokens`; `.gitignore` i ESLint ignorują `storybook-static`; AGENTS.md (root i ui), BACKWARD_COMPATIBILITY.md (eksport `./styles/*`, skrypty), linia UI/UX w specyfikacji E01 (S20).

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 169 testów, 100% we wszystkich metrykach |
| `npm run build` | OK; zbudowany CSS aplikacji zawiera tokeny (`--primary:var(--raw-teal-800)`) |
| `npm run build-storybook` | OK |
| `npm run test:storybook` | po F1: OK – 20/20 w obu motywach (przed F1: 18/20) |
| `npm run lint:tokens` | **FAIL** – 17 wartości arbitralnych w istniejących prymitywach shadcn (alert, badge, button, card, native-select) – praca etapu 2 |

### Decyzje F1–F6 (Arkadiusz, 2026-10-19)

F1 przyjęte i wdrożone (ciemny `--destructive` = red-300, kontrast przeliczony, także w `lekcja-06/tokeny.md`). F2 przyjęte. F3 przyjęte jako propozycje (P5) – zostają oznaczone na stronie Motion do zatwierdzenia tokenów. F4 i F5 przyjęte – do zrobienia w etapie 2. F6 – decyzja na stronie Content (etap 4).

Pierwotne propozycje:
- **F1 (kontrast, zatrzymanie wg promptu).** Ciemny motyw: `destructive` na swoim tle – przycisk shadcn używa w dark `bg-destructive/20` i hover `/30`: 4,48 : 1 na card, hover 3,72 (card) i 4,33 (background). tokeny.md liczył `/20` tylko na background (5,27). Propozycja: ciemny `--destructive` = red-300 `oklch(80.8% 0.114 19.571)` → 5,97 / 4,64 na card, 10,28 na background. Alternatywa: w etapie 2 przycisk dark `/10` i hover `/20` (hover na card nadal 4,49 – nie przechodzi).
- **F2.** Maks. szerokość treści 1440: `max-w-5xl` (1024 px), tekst `max-w-prose` – propozycja.
- **F3.** Ruch (P5): przejścia hover/focus 150 ms, nakładki 100–150 ms, wiadomości bez animacji, `prefers-reduced-motion` usuwa animacje – propozycje na stronie Motion; po akceptacji tokeny `--duration-*`.
- **F4.** `shadcn` i `tw-animate-css` są zależnościami app, a `storybook.css` (ui) je importuje (działa przez hoisting). Propozycja: zadeklarować je w `@devmentor/ui` w etapie 2 (zgoda na zależności).
- **F5.** Prymitywy base-nova importują `cn` z pakietu `cn`, nie z `lib/utils` – w etapie 2 przepinam na `@devmentor/ui/lib/utils` (S8), inaczej nowe klasy nie scalają się.
- **F6.** Format kwot w przykładach: „PLN 180.00” (angielski interfejs) – tymczasowo, do strony Content / `formatPrice`.

### Czego nie sprawdzono
- `npm run storybook` (serwer dev) – sprawdzony tylko zbudowany Storybook (statycznie, zrzuty w Chromium 1440 px oba motywy, przykład 320 px bez poziomego przewijania).
- Testy integracyjne (`npm run test:integration`) – nie uruchomione (wymagają Dockera; zmiana dotyczy CSS aplikacji – build przeszedł).
- Ręczna obsługa klawiaturą w managerze Storybooka.
- Ikona karty Storybooka to nadal domyślna ikona Storybooka.
- W ciemnym motywie „chrom” stron Docs (tekst MDX) zostaje jasny; podglądy w `Unstyled` są w motywie.

## Zasada procesu (2026-10-19)

Nigdy nie uruchamiać `git stash` (ani innych komend, które chowają lub kasują lokalny stan) – reguła przeglądu R3. Incydent z etapu 1 opisany w logu przebiegu.

## Etap 2 – decyzje właściciela (Arkadiusz, 2026-10-19)

- 2.1 tak – `sm` 28 px tylko w gęstych wierszach (40 px przy `pointer: coarse`).
- 2.2 tak – kółko radia i tor przełącznika okrągłe.
- 2.3 12 px.
- 2.4 podpowiedzi w `muted-foreground` (7,3 : 1); błędy w `destructive` z ikoną i instrukcją.
- 2.5 „(optional)” przy polach opcjonalnych, bez gwiazdek.
- B1–B25 przyjęte w całości (B14: kontrast policzyć przed zapisem; B16 idzie za F3).
- „dalej” → partia 1 (Button, Input, Textarea, NativeSelect, Label, Field) + B23/B24/B25.

## Etap 2 – różnice względem bazy (2026-10-19, przyjęte – patrz decyzje wyżej)

Baza = shadcn base-nova w stanie z repo (`src/components/ui/*`, tokeny już nasze po etapie 1). Przy każdej różnicy: co robi baza → co robi DevMentor → skąd. „Decyzja” = wynika wprost z zatwierdzonych decyzji; **Bn** = moja propozycja do osobnej zgody. Nic z tego nie jest jeszcze w kodzie.

### Wysokość i gęstość

| # | Baza | DevMentor | Źródło |
|---|---|---|---|
| – | Przycisk `h-8`, pole i select `h-8`, przycisk-ikona `size-8` – sztywne 32 px także na dotyku | `h-control` / `size-control` (32 px; 40 px przy `pointer: coarse`) | decyzja P4 |
| B1 | Przycisk ma 8 rozmiarów: `xs` 24, `sm` 28, `default` 32, `lg` 36, `icon`, `icon-xs`, `icon-sm`, `icon-lg` | Zostają `default`, `sm`, `icon`, `icon-sm`; usuwam `xs`, `lg`, `icon-xs`, `icon-lg` (nieużywane w repo; usunięcie z istniejącego komponentu wymaga zgody – zasada 12) | propozycja; zasada 6 (bez wariantów „na zapas”) |
| B2 | `sm` = 28 px zawsze (używane w akcjach wierszy DataTable i adminie, w ErrorMessage) | `sm` tylko w gęstych wierszach (akcje wiersza tabeli/listy): nowy token komponentu `--control-height-sm` = 28 px, 40 px przy `pointer: coarse`; to samo dla `native-select` `sm` | propozycja; R01.1 (gęstość), P4, WCAG 2.5.8 (≥ 24 × 24) – pytanie 2.1 |
| – | Odstępy między polami formularza: brak reguły w bazie | etykieta–pole–podpowiedź–błąd w `Field`: `gap-in-group` (8 px); między polami: `gap-between-groups` (16 px) | decyzja T8 (w grupie / między grupami) |

### Promienie

| # | Baza | DevMentor | Źródło |
|---|---|---|---|
| – | `--radius` shadcn 10 px | 6 px (już w tokenach) | decyzja T7, A01/P13 |
| B3 | Kontrolki `rounded-lg`, karta i nakładki `rounded-xl`, odznaka `rounded-4xl` (pigułka, 15,6 px), małe przyciski `rounded-[min(var(--radius-md),10px)]`, checkbox `rounded-[4px]` | Jeden promień `rounded-lg` (6 px) dla kontrolek, kart, list i nakładek; `rounded-md` (4,8 px) dla małych elementów (odznaka, checkbox, kbd); bez wartości arbitralnych | propozycja; T7, P13 („nie więcej niż `xl`”), A01 („wszystko w pigułkach”, duże zaokrąglenia), zasada 3 |
| B4 | Radio i przełącznik `rounded-full` | Wyjątek od „pełne koło tylko awatar”: kółko radia i tor przełącznika zostają okrągłe, bo kształt identyfikuje rodzaj kontrolki | propozycja; P13 mówi tylko o awatarach – pytanie 2.2 |

### Obramowania i wypełnienia

| # | Baza | DevMentor | Źródło |
|---|---|---|---|
| – | Pole i select `border-input` | bez zmian – stone-500, 4,81 : 1 na card | decyzja T3, WCAG 1.4.11 |
| – | Karta `ring-1 ring-foreground/10` | `border border-border` – ta sama linia 1 px co separatory wierszy, bez cienia | decyzja R01.3, P3, T5 |
| B5 | Warianty mają osobne wypełnienia w ciemnym motywie: `outline` `dark:border-input dark:bg-input/30`, `ghost` `dark:hover:bg-muted/50` | Jedna definicja dla obu motywów (`outline`: `border-border bg-transparent`, hover `bg-muted`; `ghost`: hover `bg-muted`). Wyjątek: `destructive` zostaje z `dark:/20` i `/30` (policzone w F1) | propozycja; spójność motywów (P1), kontrast tych wypełnień nie był liczony |
| B6 | Pole w ciemnym motywie `dark:bg-input/30` (półprzezroczysty stone-500), zablokowane `bg-input/50` / `dark:bg-input/80` | Pole `bg-transparent` w obu motywach; zablokowane `bg-muted` | propozycja; T5/T3 (pole identyfikuje obrys, nie wypełnienie), pary tekst/placeholder na `input/30` niepoliczone |
| B7 | `native-select` opcje `bg-[Canvas] text-[CanvasText]` (kolory systemowe jako wartości arbitralne) | `bg-popover text-popover-foreground` | propozycja; zasada 3, T13 |

### Odstępy wewnętrzne i typografia kontrolek

| # | Baza | DevMentor | Źródło |
|---|---|---|---|
| B8 | Przycisk `px-2.5` (10 px), ikona–tekst `gap-1.5` (6 px); pole `px-2.5` | Przycisk i pole `px-3` (12 px, ten sam krok co `--list-row-px`, więc tekst w polu, przycisku i wierszu listy zaczyna się na tej samej linii); `sm` `px-2`; ikona–tekst `gap-2` (8 px, krok `--space-in-group`) | propozycja; materiały milczą – pytanie 2.3 |
| – | Przycisk `text-sm font-medium`, etykieta `text-sm leading-none font-medium`, `sm` `text-[0.8rem]` | Przycisk i etykieta `type-label` (14 px / 500, normalna interlinia – długa etykieta i dłuższy język się zawijają); `sm` też `type-label` | decyzja P2; zasada 3 |
| B9 | Pole `text-base` poniżej `md`, `md:text-sm` (zależne od szerokości) | `type-body` (14 px), a `pointer-coarse:text-base` (16 px) – iOS nie powiększa wtedy strony przy fokusie; ten sam warunek co wysokość (P4) | propozycja; P2, P4 |
| B10 | Opis pola `text-sm text-muted-foreground`, błąd `text-sm text-destructive` | Opis `type-body text-muted-foreground`; błąd `type-body text-destructive` zawsze z ikoną `CircleAlert` (`aria-hidden`) i tekstem „co się stało i co zrobić” | propozycja; WCAG 1.4.1, 3.3.1; tokeny.md: `muted-foreground` nie dla „tekstu, który trzeba przeczytać, by działać” – pytanie 2.4 |
| B11 | Brak oznaczenia pól wymaganych/opcjonalnych | Oznaczamy mniejszość: domyślnie pola wymagane bez gwiazdki (`required` → `aria-required`), opcjonalne z dopiskiem „(optional)” w etykiecie | propozycja; WCAG 3.3.2 – pytanie 2.5 |

### Stany

| # | Stan | Baza | DevMentor | Źródło |
|---|---|---|---|---|
| – | Fokus | `focus-visible:border-ring ring-3 ring-ring/50` | bez zmian – pierścień neutralny, 3,35 : 1 (jasny), 4,98 : 1 (ciemny); odznaka `ring-[3px]` → `ring-3` | decyzja T4, WCAG 2.4.7, 1.4.11; zasada 3 |
| B12 | Fokus przycisku `destructive` | `focus-visible:ring-destructive/20` (1,47 : 1 – poniżej 3 : 1) | ten sam neutralny pierścień co wszędzie | propozycja; T4, WCAG 1.4.11 |
| B13 | Fokus pola z błędem | `aria-invalid:ring-destructive/20` i `focus-visible:ring-ring/50` konkurują – wynik zależy od kolejności klas | fokus zawsze pokazuje neutralny pierścień; czerwony obrys (`border-destructive`, 8,37 : 1) zostaje | propozycja; T4, tokeny.md (pierścień błędu tylko dodatkiem) |
| – | Najechanie `default` | `hover:bg-primary/80` | bez zmian – 4,70 : 1 (jasny), 6,96 : 1 (ciemny) | decyzja (akcent, tokeny.md) |
| B14 | Najechanie `secondary` | `hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]` (arbitralne); u nas `secondary` = `muted` = `accent` (stone-100), więc `hover:bg-muted` byłby niewidoczny | nowy token znaczeniowy `--secondary-hover` (jasny stone-200, ciemny stone-700) i klasa `hover:bg-secondary-hover`; kontrast policzę przed zapisem | propozycja; zasada 3, P4 |
| B15 | Wciśnięty | `active:not-aria-[haspopup]:translate-y-px` (przycisk „wpada” o 1 px) | bez przesunięcia; wciśnięty = kolor najechania | propozycja; charakter „spokojny”, ruch czeka na F3 |
| B16 | Przejścia | `transition-all` | `transition-colors` (domyślne 150 ms) + `motion-reduce:transition-none` | propozycja; zależy od zatwierdzenia F3 (strona Motion), WCAG 2.3.3 |
| B17 | Zablokowany | `disabled:opacity-50 pointer-events-none` – brak informacji, dlaczego | wygląd bez zmian (WCAG 1.4.3 zwalnia nieaktywne kontrolki), ale reguła: przyczyna blokady zawsze widoczna jako tekst obok (opis pola lub zdanie przy przycisku), nigdy tylko w podpowiedzi; w formularzu zamiast blokować przycisk – walidacja przy wysłaniu | propozycja; prompt (etap 4 „zablokowany przycisk bez wyjaśnienia”, „podpowiedź z informacją niezbędną”) |
| B18 | Ładowanie | brak | bez nowego propsa: kompozycja `disabled` + `aria-busy` + `Spinner` + etykieta w formie „Saving…”; blokuje podwójne wysłanie | propozycja; zasada 6, prompt etap 3 (blokada podwójnego wysłania) |
| B19 | Akcja tekstowa (`variant="link"`) | `text-primary`, podkreślenie dopiero przy najechaniu | `text-foreground` z podkreśleniem zawsze (`underline-offset-4`), najechanie `decoration-2` | propozycja; T11 (linki w treści), P5/K3 (akcent tylko na jednym elemencie), WCAG 1.4.1 |
| – | Błąd pola | `aria-invalid:border-destructive` + `ring-destructive/20` | bez zmian + tekst błędu (B10) | decyzja tokeny.md (obrys 8,37 : 1), WCAG 1.4.1 |
| – | Rozwinięty (`aria-expanded`) | `bg-muted` | bez zmian | decyzja P4 (`muted` = wyciszone tło) |

### Wartości strukturalne (lint:tokens)

| # | Baza | DevMentor | Źródło |
|---|---|---|---|
| B20 | Układ siatki jako wartości arbitralne: alert `grid-cols-[auto_1fr]`, karta `grid-cols-[1fr_auto]`, `grid-rows-[auto_auto]`, `[--card-spacing:--spacing(4)]` | Nazwane szablony w `theme.css` (`--grid-template-columns-icon-content: auto 1fr` → `grid-cols-icon-content`, `grid-cols-content-action`), odstęp karty → `p-panel` / `gap-between-groups`; robione w partii, w której jest komponent (alert, karta – partia 3) | propozycja; zasada 3 |
| B21 | Karta ma rozmiar `sm` (12 px) | usuwam `size="sm"` (nieużywany; brak tokenu 12 px dla panelu) | propozycja; T8, zasada 12 |

### Pytania (materiały milczą)

- **2.1** Czy P4 („32 px na desktopie”) dopuszcza mniejszy przycisk 28 px w gęstych wierszach (B2), czy wszystko ma mieć 32 px (wtedy `sm` = `default`, a akcje wierszy w adminie urosną o 4 px)?
- **2.2** Czy kółko radia i tor przełącznika mogą być okrągłe (B4), mimo że P13 mówi „pełne koło tylko awatar”?
- **2.3** Poziomy padding kontrolek: 12 px (B8) czy zostawić 10 px bazy? Materiały mówią tylko o wierszu listy (T9).
- **2.4** Podpowiedź pod polem: `muted-foreground` (B10) czy `foreground`? tokeny.md wyklucza `muted-foreground` dla tekstu potrzebnego do działania, a podpowiedź (np. format) czasem nim jest.
- **2.5** Oznaczanie pól: „(optional)” przy opcjonalnych (B11) czy gwiazdka przy wymaganych?

### Partia 1 – skład (propozycja)

| # | Komponent | Skąd | Ekrany i specyfikacje, które go potrzebują |
|---|---|---|---|
| 1 | Button (warianty `default`, `secondary`, `outline`, `ghost`, `destructive`, `link` = akcja tekstowa) | istniejący | wszystkie ekrany; główna akcja (P5), akcje wierszy, CrudForm, DataTable, ErrorMessage |
| 2 | Input | istniejący | logowanie, profil mentora, sloty, CrudForm |
| 3 | Textarea | nowy, `npx shadcn@latest add textarea` | pytanie przy rezerwacji (licznik 2000), powód odrzucenia (≤ 280), bio mentora |
| 4 | NativeSelect | istniejący (S12) | strefa czasowa, długość sesji 25/50, CrudForm |
| 5 | Label | istniejący | każde pole |
| 6 | Field (+ FieldLabel, FieldDescription, FieldError, FieldGroup) | nowy, `npx shadcn@latest add field` – pociąga `separator` (jest w planie) i chce nadpisać `label` | wszystkie formularze; etykieta, podpowiedź, błąd, wymagane/opcjonalne |

- **B22** Link w treści (T11) przesuwam do partii 3 (razem z Alert i Card, gdzie występuje w tekście); wtedy zdecydujemy, czy to osobny komponent, czy styl bazowy `a`. Akcja tekstowa jest w partii 1 jako wariant `link` przycisku.
- Kolejne partie (szkic): 2 – Checkbox, RadioGroup, Switch, InputGroup, Kbd, Separator; 3 – Card, Badge, Alert, Avatar, Item, link w treści; 4 – Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs; 5 – Skeleton, Spinner, Table + przegląd bloków `backend/` (EmptyState, ErrorMessage, LoadingMessage).
- CLI: uruchamiam w `packages/ui` bez `--overwrite`; nadpisania `label` odmawiam (porównanie z `git show HEAD:…`, nie stash), potem sprawdzam `package.json` i lockfile i usuwam zależności spoza planu (zasada 6).

### Zmiany zależności i importów potrzebne w partii 1 (F4, F5)

- **B23 (F4)** Dopisać do `dependencies` `@devmentor/ui`: `shadcn` `^4.21.4` i `tw-animate-css` `^1.4.0` – te same wersje, które są już w lockfile przez app (lockfile bez nowych wersji). `dependencies`, nie `devDependencies`, bo prymitywy ui używają wariantów `data-open:` / `data-checked:` z `shadcn/tailwind.css` i animacji z `tw-animate-css` wszędzie, gdzie są renderowane, nie tylko w Storybooku. App zostawia swoje wpisy (jej `globals.css` importuje je bezpośrednio; bez zmian w app – zasada 11).
- **B24 (F5)** Przepiąć `import { cn } from "cn"` → `@devmentor/ui/lib/utils` we wszystkich 9 istniejących prymitywach od razu w partii 1 (nie tylko w 4 z partii), żeby nowe klasy (`h-control`, `type-label`, `gap-in-group`) scalały się poprawnie wszędzie. Wartości arbitralne w karcie, alercie i odznace poprawiam w ich partii (lint:tokens zostaje czerwony do partii 3).
- **B25** Reguła ESLint `no-restricted-imports` dla `"cn"` w `packages/ui/src/components/**` (dozwolone tylko w `lib/utils.ts`), bo CLI base-nova za każdym razem generuje import z `"cn"` mimo aliasu `utils` w `components.json`.
- Wpływ na app (bez zmian w jej kodzie): zmiana wysokości, paddingu i promieni przycisków, pól i selectów zmieni wygląd stron admina (`/admin`, `/admin/users`); testy jednostkowe ui nie sprawdzają klas wyglądu (tylko `w-1/2` w DataTable), testy integracyjne szukają po roli i nazwie – zrzuty ekranu się zmienią.

## Etap 2 – partia 1, wynik (2026-10-19)

### Co powstało / zmieniło się
- **B23 (F4)**: `shadcn ^4.21.4` i `tw-animate-css ^1.4.0` w `dependencies` `@devmentor/ui`. Lockfile: tylko 2 linie w wpisie workspace, żadna wersja się nie zmieniła. Uwaga: `npm install -w … shadcn@^4.21.4` podniósł shadcn do 4.22.1 (i zod w jego drzewie) – cofnięte przez przywrócenie mojej kopii lockfile sprzed instalacji i ręczny wpis w `package.json` + `npm install`; zainstalowane 4.21.4.
- **B24 (F5)**: wszystkie prymitywy importują `cn` z `@devmentor/ui/lib/utils`. **B25**: `eslint.config.mjs` – `no-restricted-imports` dla `"cn"` w `packages/ui/src/components/**` (sprawdzone: błąd na próbce, `lib/utils.ts` dozwolony).
- CLI `npx shadcn@latest add textarea field` (4.22.1 przez npx, bez zmian w `package.json`/lockfile): nowe `textarea.tsx`, `field.tsx`, `separator.tsx`; nadpisania `label.tsx` odmówiłem.
- Tokeny: `--control-height-sm` (28 px; 40 px przy `pointer: coarse`) → `h-control-sm`/`size-control-sm`; `--secondary-hover` (jasny stone-200: 13,92 : 1 ze `secondary-foreground`; ciemny stone-700: 9,85 : 1 – policzone przed zapisem, B14) → `bg-secondary-hover`. `cn` zna `control-sm` (test w `utils.test.ts`).
- Prymitywy wg B1–B19: Button (rozmiary `default`/`sm`/`icon`/`icon-sm`, `type-label`, `px-3`, neutralny fokus także w `destructive`, bez `translate-y`, `transition-colors` + `motion-reduce`, `link` = `foreground` + stałe podkreślenie, `secondary` hover tokenem), Input/Textarea/NativeSelect (`h-control`, `px-3`, `type-body` + `pointer-coarse:text-base`, przezroczyste tło w obu motywach, wyłączone `bg-muted`, fokus neutralny przy błędzie, opcje na `popover`), Label (`type-label`, `gap-in-group`), Field (przycięty do Field/FieldGroup/FieldLabel z `optional`/FieldDescription/FieldError z ikoną; `gap-in-group` / `gap-between-groups`). FieldSet, FieldLegend, FieldContent, FieldTitle, FieldSeparator i orientacje poziome usunięte do partii 2 (zasada 6).
- Storybook: `stories/primitives/{Button,Input,Textarea,NativeSelect,Label,Field}.mdx` (13 sekcji, źródło przy regułach, propozycje oznaczone) + `.stories.tsx` (Playground, warianty/rozmiary, macierz stanów, długa treść 320 px, test play); bloki `StateMatrix`, `DoDont` w `.storybook/blocks/Docs.tsx`; zamrożone stany: `@custom-variant hover / focus-visible / active` w `.storybook/storybook.css` reagują też na `data-preview-state` (tylko build Storybooka). `optimizeDeps.include` w `vitest.storybook.config.mts` (pierwszy przebieg na zimnym cache przeładował Vite i wywrócił testy; po dopisaniu nie sprawdzone na czystym cache).
- `packages/ui/AGENTS.md`: reguła ESLint dla `cn`, odmowa nadpisania, wzór dokumentacji komponentu.

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 169 testów, 100% we wszystkich metrykach |
| `npm run build` | OK; CSS aplikacji zawiera `--secondary-hover`, `--control-height-sm` |
| `npm run build-storybook` | OK; 6 stron dokumentacji sprawdzonych w zbudowanym Storybooku (Chromium): 13 nagłówków sekcji, tabele renderują się jako tabele, brak błędów (pierwsza wersja Button.mdx padała na `{label}` i `|` w kodzie w tabeli – poprawione) |
| `npm run test:storybook` | OK – 84/84 (42 stories × 2 motywy; 32 nowe stories, 7 testów interakcji), a11y bez naruszeń |
| `npm run lint:tokens` | FAIL – zostało 6 (z 17): alert `grid-cols-[auto_1fr]`, badge `ring-[3px]`, card `[--card-spacing:…]` ×2, `grid-cols-[1fr_auto]`, `grid-rows-[auto_auto]` – partia 3 (B20, B21) |

### Czego nie sprawdzono
- Ręczna obsługa klawiaturą w managerze Storybooka i `npm run storybook` (dev) – tylko build statyczny + testy play.
- Wygląd na prawdziwym urządzeniu dotykowym (`pointer: coarse` – 40 px, 16 px tekstu) – tylko CSS.
- Testy integracyjne aplikacji (Docker) – admin (`/admin/users`) zmienia wygląd (wysokość/padding/promień przycisków i pól); kod app bez zmian.
- Stories z `globals.viewport` (320 px) w testach Vitest renderują się bez wymuszenia szerokości; szerokość 320 sprawdzona tylko zrzutem `FormNarrow`.
- Ciemny „chrom” stron Docs nadal jasny (znane z etapu 1).

### Do „What is missing” (etap 4)
- `CrudForm` nie używa jeszcze `Field` (brak podpowiedzi, `aria-describedby`, „(optional)”).
- Podpowiedź (Tooltip) dla przycisków-ikon – partia 4.
- Licznik znaków (`QuestionField`) – komponent produktu, etap 3.

## Etap 2 – partia 2, wynik (2026-10-19)

Checkbox, RadioGroup, Switch, InputGroup, Kbd, Separator (dokumentacja; plik z partii 1) + przywrócone FieldSet, FieldLegend, FieldContent i `Field orientation="horizontal"`.

### Propozycje B26–B33 (materiały milczą; wdrożone zachowawczo i odwracalnie – do zatwierdzenia)
| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| B26 | Zaznaczony checkbox, radio i włączony switch w neutralnym `foreground` (znak/kropka/kciuk w `background`), nie w akcencie `primary` jak w bazie | P5/K3 – akcent tylko na jednym elemencie ekranu (np. *Pay*); spójne z neutralnym fokusem T4 |
| B27 | Pole 16 px, niewidoczny obszar trafienia `::after` 40 × 32 px, przy dotyku 40 × 40 (switch 56 × 36 / 56 × 44) | P4, WCAG 2.5.8 |
| B28 | Bez wzorca „choice card” (etykieta-karta podświetlana po zaznaczeniu, `bg-primary/5`) | zasada 6; byłaby to ramka w ramce (R01.3/P3) i akcent (P5) |
| B29 | Switch w jednym rozmiarze, tor 32 × 20 px ze skali (zamiast arbitralnych 32 × 18,4 i 24 × 14 px), bez propsa `size` | zasada 3, zasada 6 |
| B30 | `InputGroupButton` ma rozmiary `icon-sm` (domyślny) i `sm` z Button zamiast `xs`/`icon-xs` bazy (usunięte w B1) | B1, B2 |
| B31 | Przy dotyku przycisk w InputGroup ma 36 px (mieści się w grupie 40 px) – **poniżej P4 (40 px)**, powyżej WCAG 2.5.8 (24 px). **Do potwierdzenia**; alternatywa: grupa z przyciskiem 48 px przy dotyku | P4 vs geometria grupy |
| B32 | `FieldLegend` bez wariantów, zawsze rola `type-label`; `FieldContent` bez dodatkowego odstępu (tytuł + linia podpowiedzi jak wiersz listy); FieldSet `gap-in-group` | P2, R01.1/T12, T8 |
| B33 | Bez orientacji `responsive` w Field (etykieta obok pola od szerokości @md) | zasada 6; formularze jednokolumnowe |

Decyzje wynikające wprost: radio i tor przełącznika okrągłe (2.2), `rounded-md` checkboxa i Kbd (B3), brak ciemnych wypełnień `input/30` (B6), neutralny fokus przy błędzie (B13), `transition-colors` + `motion-reduce` (B16), Kbd w Geist sans, nie mono (R01.2), odstęp między opcjami 8 px (T8), wyłączona grupa bez przyciemniania jednostki (*PLN*) – tylko pole jest wyciszone (axe: kontrast 2,24 : 1 przy `opacity-50` na całej grupie).

### Co się zmieniło
- CLI `npx shadcn@latest add checkbox radio-group switch input-group kbd`: 5 nowych plików; nadpisania `button`, `input`, `textarea` odmówiłem; `package.json` i lockfile bez zmian (porównane z kopią sprzed CLI).
- `vitest.storybook.config.mts`: `optimizeDeps.include` rozszerzone o checkbox/radio/radio-group/switch Base UI (pierwszy przebieg znów przeładował Vite).
- Strony batch 1 (Button, Input, NativeSelect, Label) odsyłają teraz do istniejących komponentów zamiast „(batch 2)”; Field.mdx: anatomia, orientacje, API.
- Story `Field/Orientations`.

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 169 testów, 100% |
| `npm run build` | OK |
| `npm run build-storybook` | OK; 12 stron prymitywów: po 13 sekcji, tabele bez rozjechanych wierszy, bez widocznych błędów renderowania |
| `npm run test:storybook` | OK – 148/148 (74 stories × 2 motywy; 32 nowe, 7 nowych testów interakcji) |
| `npm run lint:tokens` | FAIL – bez zmian, 6 wartości w card/alert/badge (partia 3) |

Znalezione i naprawione po drodze: `id` z spacją (`tag-AI agents`) psuł etykietę checkboxa (axe `aria-toggle-field-name`); `cn` usuwał `font-sans` przed `type-meta` w Kbd (role `type-*` kolidują z font-family w konfiguracji `cn`) – kolejność klas odwrócona.

### Czego nie sprawdzono
- Prawdziwe urządzenie dotykowe (obszary trafienia przy `pointer: coarse`, B27/B31).
- Testy integracyjne aplikacji (Docker) – app nie używa nowych komponentów.
- Ręczna klawiatura w managerze Storybooka.

### Decyzje właściciela B26–B33 (Arkadiusz, 2026-10-19)

- B26, B27, B28, B29, B30, B32, B33 – przyjęte.
- B31 – przyjęta alternatywa: przy `pointer: coarse` InputGroup z przyciskiem (addon `inline-*`) rośnie do 48 px, przycisk ma 40 px (P4); bez przycisku grupa zostaje 40 px. Wdrożone (`pointer-coarse:has-[>[data-align^=inline]_button]:h-12`, usunięte 36 px przycisku), dokumentacja InputGroup zaktualizowana.
- Po B31: lint, typecheck, test:coverage, build-storybook, test:storybook – wyniki w logu przebiegu.
