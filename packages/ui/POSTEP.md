# POSTĘP: design system DevMentor (Storybook)

Plik roboczy zadania z `lekcja-06/prompt-storybook.md`. Nowa sesja: przeczytaj prompt i ten plik, kontynuuj od „Następny krok”.

## Stan etapów

| Etap | Stan |
|---|---|
| 0. Inwentaryzacja i plan | zakończony 2026-10-19 – decyzje właściciela zapisane niżej |
| 1. Fundamenty | zakończony 2026-10-19 – F1 wdrożone, F2–F6 zapisane; czeka na „dalej” |
| 2. Komponenty bazowe | **zakończony** 2026-10-19 – partie 1–5, scalone w `main` (PR #41) |
| 3. Komponenty produktu, wzorce, ekrany | w toku – partia 1 zacommitowana, C18–C28 zatwierdzone |
| 4. Strony, które uczą | nie rozpoczęty |
| 5. Sprawdzenie i raport | nie rozpoczęty |

## Następny krok

Etap 3, partia 2 gotowa razem z Q6/Q7 (sekcje „Etap 3 – partia 2, wynik” i „…decyzje i Q6/Q7” na końcu pliku; commit robi koordynator). Po „dalej” partia 3: profil i oferta mentora (TagList, PublicWorkLinks, PriceList, MentorProfileHeader, MentorProfileForm, OfferChecklist; ekrany `/mentor`, `/mentor/profile`).

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

## Etap 2 – partia 3, wynik (2026-10-19)

Card, Badge, Alert (istniejące – dopasowane), Avatar, Item (CLI), link w treści (utility `link-text`). B20/B21 wdrożone: `npm run lint:tokens` = 0.

### Propozycje B34–B46 (materiały milczą; wdrożone zachowawczo, odwracalnie – do zatwierdzenia)
| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| B34 | Link w treści = utility `link-text` w `theme.css` na zwykłym `<a>` (nie komponent): `foreground`, stałe podkreślenie, hover 2 px, fokus: obrys 3 px `ring/50`. Stany zamrożone zdublowane w `storybook.css`. Używają go `AlertTitle/Description` i `FieldDescription` (`[&_a]:link-text`) | T11, WCAG 1.4.1; prymitywy shadcn tylko z CLI, a link nie jest prymitywem shadcn |
| B35 | Item = gęsty wiersz: `ItemGroup` rysuje jedną ramkę i linie 1 px (`divide-y`), `Item` bez wariantów i rozmiarów; usunięte ItemHeader, ItemFooter, ItemSeparator, media „image” | R01.1, R01.3/P3, T9, T12, zasada 6 |
| B36 | Klikalny wiersz = nowa część `ItemLink` w `ItemTitle`, rozciągnięta na wiersz (`after:inset-0`); hover wiersza `muted`, fokus = wewnętrzny pierścień całego wiersza; akcje wiersza nad linkiem. `Item` ma `role="listitem"` (baza dawała `role="list"` bez `listitem`) | WAI-ARIA, WCAG 1.3.1; część dopisana ręcznie do prymitywu z CLI |
| B37 | `CardTitle` w roli `type-section-title` (18 px / 600) | P2 |
| B38 | `CardFooter` bez tła `muted/50`, tylko linia u góry | R01.3 (linie, nie wypełnienia) |
| B39 | Badge bez wariantów `ghost` i `link` | zasada 6; mylą się z przyciskiem i linkiem |
| B40 | Alert: padding 12 × 8 px (jak wiersz kontrolki), przy dotyku min. 48 px wysokości, gdy ma akcję | B8, R01.1, P4 |
| B41 | (nie wdrożone) Alert `destructive` z czerwoną ramką – zostawiona ramka `border`, bo ikona + tytuł już niosą znaczenie | zachowawczo: baza |
| B42 | Alert zostaje `role="alert"` domyślnie; dokumentacja: komunikat obecny przy ładowaniu strony → `role="status"` | WAI-ARIA |
| B43 | Avatar w jednym rozmiarze 32 px (bez `sm`, `lg`) | zasada 6; jedyne użycie: autor grupy wiadomości (R02.3) |
| B44 | **Fallback awatara**: 1–2 inicjały w `muted-foreground` na `muted` (7,01 : 1), te same neutralne kolory dla wszystkich; bez imienia – neutralna ikona osoby; nigdy kolor wyliczany z imienia ani gradient. Obok widocznego imienia awatar `aria-hidden` | A01, P9, R02.3, WCAG 1.1.1 |
| B45 | Usunięte `AvatarBadge` (kropka obecności), `AvatarGroup`, `AvatarGroupCount` („+N”) | P9, P10 |
| B46 | Badge: domyślny wariant `secondary` zamiast `default` (akcent) | T10 – statusy nie w akcencie; app zawsze podaje wariant jawnie |

Wynika wprost: Card – ramka `border` zamiast `ring`, `rounded-lg`, `p-panel`/`gap-between-groups`, bez `size` (B21, B3, T8); siatki `grid-cols-icon-content` i `grid-cols-content-action` w `theme.css` (B20) i w `cn`; Badge `rounded-md` (B3, A01), `ring-3`; linki w Alert w `foreground` (T11).

### Co się zmieniło
- CLI `add avatar item`: 2 nowe pliki, nadpisania `separator.tsx` odmówiłem; `package.json` i lockfile bez zmian.
- `theme.css`: szablony siatki, utility `link-text`; `utils.ts` + test: `grid-cols-*` scalają się w `cn`.
- `.storybook/storybook.css`: lustrzane stany `link-text` i pierścienia wiersza Item; `optimizeDeps` + avatar, merge-props, use-render.
- Nowe strony i stories: Card, Badge, Alert, Avatar, Item, Text link (13 sekcji, macierze stanów, wąski ekran, testy play).
- Skrypt `lint:tokens` liczy też komentarze – trzy komentarze z przykładowymi klasami arbitralnymi przeredagowane.
- Wpływ na app (bez zmian w jej kodzie): Card w `/admin/users` – ramka zamiast pierścienia, tytuł 18 px; Badge w `/admin` – prostokąt zamiast pigułki; `ErrorMessage` – Alert z nowym paddingiem.

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 170 testów, 100% |
| `npm run build` | OK |
| `npm run build-storybook` | OK; 6 nowych stron: po 13 sekcji, tabele równe, bez widocznych błędów |
| `npm run test:storybook` | OK – 214/214 (107 stories × 2 motywy; 33 nowe, 6 nowych testów interakcji) |
| `npm run lint:tokens` | **OK – 0 wartości spoza tokenów** (87 plików) |

### Czego nie sprawdzono
- Testy integracyjne aplikacji (Docker) – wygląd `/admin`, `/admin/users` zmieniony (Card, Badge, Alert).
- Prawdziwe urządzenie dotykowe (Alert 48 px z akcją).
- Czytnik ekranu na żywo (role list/listitem, link rozciągnięty na wiersz) – tylko axe i testy play.

### Decyzje właściciela B34–B46 (Arkadiusz, 2026-10-19)

- B34–B46 przyjęte w całości. B41 w opisanej formie: Alert z błędem bez czerwonej ramki – sygnał to ikona, tytuł i tekst.
- Partia 3 zacommitowana przez koordynatora (wszystkie sprawdzenia, w tym test:integration 11/11 i lint:tokens 0).
- „dalej” → partia 4: Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs.

## Etap 2 – partia 4, wynik (2026-10-19)

Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs. Wszystkie nakładki portalowane na `<body>` i sprawdzone w obu motywach (zasada 9): tło bierze motyw z klasy na `<html>`, co widać w zrzutach i w teście `npx vitest` (`html.dark: true`, tło panelu = `--card`/`--popover` ciemnego motywu).

### Propozycje B47–B59 (materiały milczą; wdrożone zachowawczo, odwracalnie – do zatwierdzenia)
| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| B47 | Nowy token `--overlay`: tło pod nakładką bez rozmycia – jasny: stone-950 przy 30%, ciemny: stone-950 przy 70% (strona już ciemna, więc mocniejsze zaciemnienie oddziela nakładkę) | R01.3/A01 (bez `backdrop-blur`), T5 |
| B48 | Ruch nakładek: tylko fade/zoom 100 ms, bez `slide-in-from-*`; `motion-reduce:animate-none` wszędzie | F3 (propozycja strony Motion), WCAG 2.3.3 |
| B49 | Dialog i AlertDialog: jedna szerokość `max-w-sm` (384 px), 16 px odstępu od krawędzi na wąskich ekranach, zamiast arbitralnego `calc(100%-2rem)` | zasada 3, T8 |
| B50 | AlertDialog bez `size="sm"`, bez `AlertDialogMedia` (ikonka 40 px w kółku), nagłówek wyrównany do lewej zamiast wyśrodkowany | zasada 6; prompt etap 4 „wszystko wyśrodkowane” to generyczny wygląd AI |
| B51 | AlertDialogCancel pierwszy w DOM i dostaje fokus przy otwarciu (zachowanie Base UI) – bezpieczny wybór jest łatwiejszy do trafienia | prompt etap 3 (potwierdzenie usunięcia: „przycisk rezygnacji łatwy do znalezienia”) |
| B52 | Pozycja menu: min. wysokość `control-sm` (28 px, 40 px dotyk) zamiast sztywnych `py-1` | B2, P4, WCAG 2.5.8 |
| B53 | DropdownMenu bez submenu, bez checkbox/radio items – tylko akcje | zasada 6; żadny ekran nie potrzebuje zagnieżdżonego menu ani wyboru w menu |
| B54 | DropdownMenuItem podświetlenie = `accent` (neutralny stone), nie akcent | P4, P5/K3 |
| B55 | Tooltip bez strzałki (`Arrow`) – wymagała arbitralnych przesunięć zależnych od strony | zasada 3 |
| B56 | Tooltip: domyślne opóźnienie Base UI (600 ms), bez wymuszania 0 ms jak w bazie | charakter „spokojny”; natychmiastowe podpowiedzi migoczą przy przesuwaniu myszą |
| B57 | Tabs: jeden styl „linia” (podkreślenie), bez segmentowanego `default` z bazy i bez orientacji pionowej | R01 (referencje GitHub/zakładki w stylu linii), zasada 6 |
| B58 | Lista zakładek przewija się w bok na wąskim ekranie zamiast zawijać | WCAG 1.4.10 (dozwolone dla paska narzędziowego) |
| B59 | Tabs: aktywacja ręczna (Enter/Space wybiera), zgodnie z domyślnym zachowaniem Base UI, nie automatyczna przy przesuwaniu fokusu strzałkami | WAI-ARIA (oba wzorce dozwolone; ręczna bezpieczniejsza, gdy zmiana karty jest kosztowna) |

Wynika wprost: popover/dialog/menu bez cienia i pierścienia, tylko `border` 1 px i `rounded-lg` (R01.3, B3); `type-section-title` dla tytułów dialogów (B37, P2); linki w opisach przez `link-text` (T11).

### Co się zmieniło
- CLI `add dialog alert-dialog dropdown-menu popover tooltip tabs`: 6 nowych plików; nadpisanie `button.tsx` odmówione; `package.json` i lockfile bez zmian (porównane z kopią sprzed CLI).
- `tokens.css`/`theme.css`: token i klasa `overlay`/`bg-overlay` (jasny i ciemny, policzony jako mieszanie koloru – nieprzezroczysty orientacyjnie, dekoracyjny jak maska, nie tekst).
- `.storybook/storybook.css`: dodany wariant `focus` (obok `hover`/`focus-visible`/`active`) do zamrożonych podglądów podświetlenia pozycji menu.
- `vitest.storybook.config.mts`: `optimizeDeps` rozszerzone o moduły nakładek Base UI; `provider: playwright({ contextOptions: { reducedMotion: "reduce" } })` – testy nakładek czekały na animacje wejścia/wyjścia (100 ms), co przy przeładowaniach Vite dawało sporadyczne niezgodności; z redukcją ruchu stany końcowe są natychmiastowe i powtarzalne.
- Nowe strony i stories: Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs (13 sekcji, macierze stanów, wąski ekran, testy klawiatury i powrotu fokusu po zamknięciu).
- `Field`: naprawiona kolejność selektorów (`data-[invalid=true]:**:data-[slot=field-label]:text-destructive` zamiast koloru na całym kontenerze) – przy błędzie tylko etykieta i tekst błędu są czerwone, nie cała zawartość pola; dodane `min-w-0`, żeby pole w gęstej siatce (np. w Dialogu) nie wypychało karty.
- Naprawiony niestabilny test Tabs: Base UI trzyma znikający panel w DOM z `inert` podczas przejścia, więc test filtruje `[inert]` i czeka (`waitFor`) zamiast zakładać dokładnie jeden `tabpanel` od razu.
- Treść przykładu w Dialog (powód odrzucenia > 280 znaków) zamieniona z ciągu `"x".repeat(290)` na prawdziwe, realistyczne zdanie (zasada 7 promptu – żadnych sztucznych danych).

### Sprawdzenie zasady 9 (motyw z `<html>`)
Zrzuty i zapytanie w przeglądarce (motyw ciemny ustawiony przez toolbar Storybooka na `<html>`) potwierdzają: `DropdownMenuContent` i `PopoverContent` mają tło `--card`/`--popover` ciemnego motywu (`oklch(0.216 …)`, czyli stone-900); `TooltipContent` odwraca kolory celowo (tło `foreground`, czyli w ciemnym motywie jasne stone-50 – zamierzone, bo to napis na plakietce, nie panel). Żadna nakładka nie zażółciła się/nie została jasna przez przypadek.

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 170 testów, 100% |
| `npm run build` | OK |
| `npm run build-storybook` | OK; 8 nowych stron: po 13 sekcji, tabele równe, bez widocznych błędów |
| `npm run test:storybook` | OK – 272/272 (136 stories × 2 motywy; po jednej niestabilności w Tabs, naprawionej i potwierdzonej powtórnym przebiegiem) |
| `npm run lint:tokens` | OK – 0 wartości spoza tokenów (105 plików) |

### Czego nie sprawdzono
- Testy integracyjne aplikacji (Docker) – app nie używa jeszcze tych komponentów.
- Prawdziwe urządzenie dotykowe (otwieranie nakładek, 40 px pozycji menu).
- Ręczna obsługa klawiaturą poza testami play (np. zagnieżdżone nakładki jedna nad drugą – nie występuje w zaplanowanych ekranach).
- Zachowanie przy `prefers-reduced-motion` na prawdziwej przeglądarce z włączoną redukcją ruchu systemowo (testy ustawiają to przez kontekst Playwrighta, nie przez CSS media query ręcznie sprawdzony wizualnie).

## Etap 2 – partia 5 (ostatnia), wynik (2026-10-19)

Skeleton (nowy, CLI), Spinner i Table (istniejące – dopasowane), favicon Storybooka, przegląd bloków `backend/` na żywej aplikacji. To zamyka minimalny zestaw komponentów bazowych z etapu 0/2.

### Propozycje B60–B62 (materiały milczą; wdrożone zachowawczo, odwracalnie – zatwierdzone przez Arkadiusza 2026-10-19)
| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| B60 | Skeleton zatrzymuje pulsowanie przy `prefers-reduced-motion` (`motion-reduce:animate-none`) | F3 (propozycja strony Motion), WCAG 2.3.3 |
| B61 | Nagłówek i komórka tabeli dostają padding `py-list-row`/`px-list-row` (8/12 px) zamiast sztywnego `px-2`/`h-10` – ten sam rytm poziomy co gęsty wiersz listy i pole formularza | T9, B8 |
| B62 | Najechanie wiersza i stopka tabeli: pełne `bg-muted` zamiast tła `/50` – spójnie z najechaniem `Item` i wariantów `outline`/`ghost` przycisku | P4, B5 |

Wynika wprost: `type-body`/`type-label` zamiast `text-sm`/`font-medium` (P2); `transition-colors motion-reduce:transition-none` na wierszu (B16); Skeleton `aria-hidden="true"` (WCAG 4.1.2, zasada analogiczna do avatara B44).

### Favicon Storybooka (nie B-propozycja – wykonane wprost na prośbę właściciela)
`.storybook/public/favicon.svg`: zaokrąglony kwadrat w `stone-950` ze stylizowaną literą „D” w `teal-400` – te same wartości co tokeny `--raw-stone-950`/`--raw-teal-400` (żadnego nowego koloru). Bez gradientu, poświaty, iskierek (A01). Podpięty w `manager-head.html` (`<link rel="icon">`, przed istniejącym skryptem naprawiającym tytuł – zasada 10 zostaje bez zmian) i w `main.ts` (`staticDirs: ["./public"]`, żeby plik był serwowany w dev i w zbudowanym Storybooku). Sprawdzony: `favicon.svg` trafia do `storybook-static/`, serwuje się z kodem 200, tytuł karty nadal kończy się na „DevMentor”.

### Przegląd bloków `backend/` na żywej aplikacji (nie zmieniłem ich kodu)
Uruchomiłem tymczasowo `next dev` na porcie 3101 (osobnym od serwera audytora na 3000, zatrzymany po sprawdzeniu) i przeszedłem `/admin` oraz `/admin/users` w prawdziwej przeglądarce, z prawdziwą bazą (test:integration wcześniej zostawił działający kontener). Utworzyłem dwóch użytkowników przez `CrudForm` i obejrzałem wynik w `DataTable`.

**Renderują się poprawnie, bez regresji:**
- `EmptyState` (panel z przerywaną ramką, wyśrodkowany tekst) – bez zmian wizualnych, pasuje do nowego `rounded-lg`/`border`.
- `CrudForm` (Label, Input, NativeSelect, Button) – wysokości, padding i fokus zgodne z partią 1; przycisk `Create user` w akcencie teal, `Cancel` jako link-przycisk.
- `ErrorMessage` (Alert destructive + przycisk) – nieużyty w tej ścieżce (brak błędu API), sprawdzony wcześniej w stories Alert.
- `DataTable` (Table, Badge, Button) – nagłówek i komórki z nowym paddingiem (B61), rola użytkownika jako `Badge variant="secondary"` (prostokątna, nie pigułka – B46), akcje wiersza (`Edit`/`Delete` ghost) i potwierdzenie usunięcia (inline, nie `AlertDialog` – to istniejący kod aplikacji, poza zakresem design systemu) wyglądają spójnie z tokenami.
- `LoadingMessage` – nieużyty w tej ścieżce (dane ładują się zbyt szybko, by złapać stan), sprawdzony wcześniej w stories Spinner.

**Czego nie udało się sprawdzić:** ciemny motyw tych bloków w aplikacji – `/admin` nie ma przełącznika motywu (S16, znana luka produktu), a wymuszenie klasy `dark` przez skrypt przed hydracją nie zadziałało (strona wyrenderowała się w jasnym motywie mimo `document.documentElement.classList.add("dark")` w `addInitScript`) – prawdopodobnie Next.js resetuje klasę przy hydracji. Ciemny wygląd tych samych prymitywów (Button, Alert, Badge, Table) jest natomiast zweryfikowany w Storybooku w partiach 1–5.

**Obserwacje, które NIE są dzisiejszymi B-propozycjami** (poza zakresem partii 5 – composer komponentów `backend/`, nie prymitywów), zapisane do rozważenia przy etapie 3 lub osobnej decyzji: `CrudForm` nadal buduje pola ręcznie (`Label` + `Input`/`NativeSelect` + `<p className="text-destructive text-sm">`) zamiast przez `Field`/`FieldLabel`/`FieldError` z partii 1 – działa poprawnie (kolor i tekst błędu są poprawne), ale nie korzysta z ikony błędu ani z `aria-describedby` tak jak nowy wzorzec; `CrudForm`/`EmptyState` używają `space-y-4`/`space-y-1.5`/`gap-2` (standardowe klasy Tailwinda) zamiast `gap-between-groups`/`gap-in-group` – wizualnie identyczne (te same wartości w skali odstępów), ale niespójne nazewnictwo. Żadne z tych nie jest błędem ani naruszeniem `lint:tokens` (zero znalezisk, 112 plików).

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 170 testów, 100%; w tym 50 istniejących testów `backend/*` bez zmian i bez awarii po dopasowaniu Table/Spinner/Skeleton |
| `npm run build` | OK |
| `npm run build-storybook` | OK; 3 nowe strony (Skeleton, Spinner, Table): po 13 sekcji, tabele równe, bez błędów; favicon obecny w zbudowanym katalogu |
| `npm run test:storybook` | OK – 304/304 (152 stories × 2 motywy; 16 nowych stories) |
| `npm run lint:tokens` | OK – 0 wartości spoza tokenów (112 plików) |

### Czego nie sprawdzono
- Testy integracyjne aplikacji (`npm run test:integration`, Docker) – nie uruchomione w tej sesji; ręczne sprawdzenie w przeglądarce (wyżej) zastąpiło je dla `/admin`/`/admin/users`.
- Ciemny motyw aplikacji (patrz wyżej – znana luka S16).
- Prawdziwe urządzenie dotykowe.

## Etap 3 – plan (2026-10-19, czeka na decyzje; bez kodu i bez instalacji)

Gałąź `lesson-6-ds-stage-3` (z `main` po PR #41). Granice: E03 (#33–#36) tylko w „What is missing” (P3/S13); MSW dopiero po osobnej zgodzie (S3); komponenty produktu wg specyfikacji E01 (`2026-10-19-mentor-accounts-and-offer.md`, dalej „spec E01”) i E02 (`2026-10-19-booking-and-prepayment.md`, „spec E02”) oraz D01–D16; ui nie importuje core/db/app – kształty danych przepisane z DTO specyfikacji jako typy w ui (jak `backend/api/types.ts`). **Cn** = moja propozycja do osobnej zgody.

### 3.1 Komponenty produktu

Wspólny kontrakt stanów danych (C3): komponenty-kontenery (listy, panele) mają propsy `isLoading`, `error` + `onRetry`, stan pusty; komponenty-liście eksportują `<Name>Skeleton` (ładowanie), a „błąd” dla liścia = nie dotyczy (pokazuje go kontener – zapisane w dokumentacji); „częściowe dane” = pola `null` z DTO (brak cen, nagłówka, linków, slotu). Każdy komponent: stories Loading, Empty, Error, Partial, Many, LongText (lub opisane „nie dotyczy”). Czas zawsze przez propsy `timeZone` i `now` (deterministyczne stories i testy, odpowiednik `Clock` – C2).

**Typy danych (w `src/components/<concept>/types.ts`, z DTO spec, kwoty w groszach):**
- `SessionUser = { name: string; role: "mentor" | "mentee" | "admin" }` (SessionUserDto, spec E01 API).
- `PublicMentor = { slug; name; headline: string | null; bio: string | null; tags: string[]; links: string[]; price25: number | null; price50: number | null; currency: "PLN"; soonestSlotAt: string | null }` (PublicMentorDto, bez e-maila).
- `MentorProfileInput = { name; headline; bio; tags: string[]; links: string[]; price25: number | null; price50: number | null; listed: boolean }` + `tagOptions: string[]` (MENTOR_TAGS przez props).
- `Slot = { id; startsAt: string /*ISO UTC*/; status: "open" | "booked"; bookable: boolean }` (SlotDto; `bookable` = ≥ 24 h, D13 – liczone w core).
- `Invitation = { id; email; status: "pending" | "used" | "expired"; expiresAt; createdAt }` + `link` tylko w odpowiedzi POST.
- `Booking = { id; mentor: { name; slug }; startsAt; lengthMinutes: 25 | 50; priceAmount; currency; status: "pending_payment" | "awaiting_acceptance" | "confirmed" | "declined" | "expired" | "payment_expired"; paymentStatus: "creating" | "open" | "paid" | "expired" | "refund_requested" | "refunded" | "refund_failed"; acceptBy: string | null; declineReason: string | null; question: string }` (BookingDto, status efektywny).
- `MentorBooking = Booking` bez `mentor`, z `mentee: { name }` (bez e-maila – spec E02 API).

**E01 (#25–#28):**

| # | Komponent | Concept | Ekran / sekcja spec E01 | Propsy (skrót) | Stany szczególne |
|---|---|---|---|---|---|
| 1 | `AccountMenu` | auth | nagłówek: *Log in / Register* albo imię + *Log out* (UI/UX) | `user: SessionUser \| null`, `loginHref`, `registerHref`, `onLogout` | wylogowany, zalogowany, długie imię, wylogowywanie (pending) |
| 2 | `OfferChecklist` | mentors | `/mentor` – checklista do rezerwowalności (UI/UX, fazy 2–4) | `profileComplete`, `pricesSet`, `bookableSlots: number`, `shareUrl \| null`, `listed`, `hrefs` | nowy mentor, częściowo, komplet, sloty tylko „too soon” (D13); bez paska postępu (A02) |
| 3 | `MentorProfileForm` (+ wewn. `PriceField`) | mentors | `/mentor/profile` – profil, ceny, „Show me on the public list” | `initialValues: MentorProfileInput`, `tagOptions`, `currency`, `onSubmit → ApiResult` | wszystkie stany wzorca formularza; ceny `null`; 5 linków (limit); bio 2000 |
| 4 | `MentorProfileHeader` | mentors | `/m/[slug]` – profil | `mentor: PublicMentor` | bez nagłówka/bio/linków, długie bio |
| 5 | `PriceList` | mentors | `/m/[slug]`, `MentorCard` (obie ceny, R07, D12) | `price25`, `price50`, `currency` | jedna cena `null` („not set”), duże kwoty |
| 6 | `TagList` | mentors | karta, profil (stack tags) | `tags: string[]` | 0 tagów, wszystkie 4 |
| 7 | `PublicWorkLinks` | mentors | karta, profil (N02 zamiast ocen) | `links: string[]` (≤ 5 https) | 0, 5, bardzo długi URL |
| 8 | `MentorCard` | mentors | `/mentors` (UI/UX: imię, nagłówek, tagi, linki, ceny, najbliższy slot; bez ocen) | `mentor: PublicMentor`, `href`, `timeZone` | brak najbliższego slotu, długi nagłówek; C6 |
| 9 | `InvitationLinkPanel` | mentors | `/admin/invitations` – link pokazany raz + kopiuj (UI/UX) | `email`, `link`, `expiresAt`, `timeZone`, `onDone` | skopiowano, schowek odrzucony (fallback: zaznacz tekst) |
| 10 | `InvitationStatusBadge` | mentors | `/admin/invitations` – pending / used / expired | `status` | 3 statusy (tekst, nie tylko kolor) |
| 11 | `SlotTimeField` | availability | `/mentor/slots` – data + godzina, strefa, podgląd „Starts …” (Edge Cases: DST) | `value: string \| null`, `onChange`, `timeZone`, `error` | czas nieistniejący (zmiana na letni), dwuznaczny (podgląd UTC offset), < 24 h |
| 12 | `SlotList` (+ `SlotRow`) | availability | `/mentor/slots` (właściciel), `/m/[slug]` (publiczny) – grupowanie po dniu, czas widza ze strefą | `slots: Slot[]`, `timeZone`, `rowActions?: (slot) => ReactNode`, `isLoading`, `error`, `emptyAction?` | „not bookable — starts too soon”, `booked`, 60 dni slotów, pusty („No times available right now”) |
| 13 | `AddSlotForm` | availability | `/mentor/slots` – dodanie slotu | `timeZone`, `now`, `onSubmit → ApiResult<Slot>` | `validation_error` (24 h / 60 dni / siatka 15 min / odstęp 50 min), `conflict` (duplikat) |

**E02 (#29–#32):**

| # | Komponent | Concept | Ekran / sekcja spec E02 | Propsy (skrót) | Stany szczególne |
|---|---|---|---|---|---|
| 14 | `SlotBookActions` | bookings | `/m/[slug]` – *Book 25 min · {price}*, *Book 50 min · {price}* (UI/UX) | `slotId`, `price25`, `price50`, `currency`, `hrefFor(length)` | cena brak → bez przycisku; własny slot mentora (forbidden) |
| 15 | `BookingSummary` | bookings | `/book/[slotId]` – mentor, data/godzina ze strefą, długość, cena | `mentorName`, `startsAt`, `lengthMinutes`, `priceAmount`, `currency`, `timeZone` | długie imię, 25 vs 50 |
| 16 | `QuestionField` | bookings | `/book/[slotId]` – pytanie z licznikiem 2000 | `value`, `onChange`, `error`, `maxLength=2000` | 0, blisko limitu (ogłoszenie `aria-live`), przekroczony, wklejony kod |
| 17 | `BookingForm` | bookings | `/book/[slotId]` – podsumowanie + pytanie + nota „mentor może odrzucić – pełny zwrot” + „Card payment” + *Pay* (D05, D16) | `summary`, `onSubmit({question}) → ApiResult<{bookingId, checkoutUrl}>`, `onSuccess` | `conflict` „This time was just taken”, `conflict` „Finish or abandon your previous payment first”, `payment_unavailable` (503), sieć |
| 18 | `BookingStatusBadge` | bookings | `/bookings`, `/mentor/bookings` – krótki status w wierszu | `status`, `paymentStatus` | wszystkie stany maszyny + refund_*; nigdy akcent (T10) |
| 19 | `BookingStatusPanel` | bookings | `/bookings/[id]` – status + następna akcja (*Payment processing…*, *Waiting for {mentor} — they decide by {acceptBy}*, *Confirmed*, *Declined — refund on its way*, *Expired — refund on its way*, *Refunded*, *Refund delayed — we are on it*, *Payment not completed — the time was released*) | `booking: Booking`, `audience: "mentee" \| "mentor"`, `timeZone`, `now` | powód odrzucenia (≤ 280) lub brak, długi powód |
| 20 | `PaymentPending` | payments | `/bookings/[id]` po powrocie z Checkout – sprawdzanie do 1 min, potem „This page will update shortly” | `phase: "checking" \| "slow"` | oba etapy; bez spinnera po przejściu w „slow” |
| 21 | `BookingQuestion` | bookings | `/bookings/[id]`, `/mentor/bookings` – pytanie (tekst, zachowane łamania) | `question`, `collapsed?` | 2000 znaków, kod (Q5), zwijanie w wierszu |
| 22 | `BookingRow` | bookings | `/bookings` – „tytuł + linia metadanych” (R01.1) | `booking: Booking`, `href`, `timeZone` | każdy status, długie imię |
| 23 | `MentorBookingRow` | bookings | `/mentor/bookings` – pytanie, slot, termin decyzji, *Accept* / *Decline* | `booking: MentorBooking`, `timeZone`, `now`, `onAccept → ApiResult`, `onDecline` | akceptowanie (pending), `conflict` „The acceptance deadline has passed”, po terminie (efektywnie expired) |
| 24 | `AcceptDeadline` | bookings | `/mentor/bookings`, `/bookings/[id]` – termin `acceptBy` (R05, D07) | `acceptBy`, `now`, `timeZone` | > 12 h, < 2 h (C12), minął |
| 25 | `DeclineBookingDialog` | bookings | `/mentor/bookings` – potwierdzenie „The mentee gets a full refund” + powód ≤ 280 | `menteeName`, `startsAt`, `timeZone`, `onConfirm({reason}) → ApiResult` | wysyłanie, `conflict` (już zaakceptowana / po terminie), błąd serwera |
| 26 | `PendingBookingsNotice` | bookings | `/mentor` – pozycja *Pending* (jeden wskaźnik zdarzeń, D15, P10) | `count`, `earliestAcceptBy`, `href`, `timeZone` | 0 (nie renderuje się), 1, wiele (Q2) |

Funkcje w `src/lib/` (100% testów): `format.ts` – `formatPrice(minor, currency)` (spec E01: w ui, waluta jako argument), `formatDateTime`, `formatZoneLabel`, `formatRelative(acceptBy, now)`; `time.ts` – `localToUtc(date, time, timeZone)` z testem „round-trip” (czas nieistniejący → błąd, dwuznaczny → pierwszy + offset do podglądu; spec E01 Edge Cases).

Bloki ogólne (dwa i więcej użyć – reguła Contributing; C9): `backend/forms/CopyField` (link zaproszenia, link udostępniania), `backend/filters/ActiveFilters` + `ResultCount` (`/mentors`, `/bookings`), `backend/tables/Pagination` (wydzielony z `DataTable`, używany też przez listy produktu), `backend/layout/AppHeader` + `RoleNav` (znak słowny, krótka nawigacja roli R02.6/P12, `AccountMenu`).

Poza design systemem (C13): `/dev/fake-checkout` (narzędzie dev) i strona Stripe Checkout (hostowana) – w ekranie tylko stan „przekierowanie do płatności”.

### 3.2 Wzorce (`stories/patterns/`, każdy stan = osobna story; strona MDX z regułami i źródłami)

| Wzorzec | Instancja z produktu | Stories |
|---|---|---|
| Formularz | `BookingForm` (MSW, `apiCall`) + `CrudForm` (tworzenie zaproszenia, admin) | Default, ValidationOnBlur, ValidationOnSubmit (fokus na pierwszym błędzie), Submitting (blokada podwójnego wysłania), FieldErrorFromServer (`fieldErrors`), Conflict (slot zajęty), ServerError (503 `payment_unavailable`), NetworkError, Success (dopiero po odpowiedzi serwera), ValuesKeptAfterError, Narrow320 |
| Lista z filtrami | `/mentors` (filtr tagu, spec E01 API `?tag`) + `/bookings` (status) | Default (licznik wyników), Loading, FilterActive (usuwalne filtry), NoResultsForFilters (*Clear filters*), NothingYet (z akcją utwórz: `/mentor/slots` *Add slot*; `/mentors` bez akcji – gość nic nie tworzy, opisane), Error, ManyResults (paginacja), LongText |
| Widok szczegółów | `/bookings/[id]` | Loaded (status + akcja nad zgięciem), Loading, NotFoundOrNoAccess (jeden komunikat – spec E02: `not_found` nie zdradza istnienia), Error, LongQuestion, Narrow320 |
| Potwierdzenie usunięcia | usunięcie slotu (`AlertDialog`: „Delete the slot on Tue, 4 Nov, 18:00?”, *Keep slot* / *Delete slot*) | Closed, Open (fokus na rezygnacji, B51), Deleting, ErrorBooked (`conflict` „Cancel the booking instead”), Done (wiersz znika, fokus wraca) |
| Status i następna akcja (R01.5, P5/K3) | `BookingStatusPanel` | po jednej story na stan × odbiorca (mentee/mentor) |
| Termin z odliczaniem (R05, D07) | `AcceptDeadline` w `MentorBookingRow` | MoreThan12h, Under2h, Passed |
| Czas ze strefą i DST | `SlotTimeField`, `SlotList` | Default, NonexistentTime, AmbiguousTime, ViewerInOtherZone, TooSoon |
| Kwota PLN (D12, F6) | `formatPrice`, `PriceList` | Examples (tabela przykładów), MissingPrice |
| Płatność i oczekiwanie (D16, R03) | `BookingForm` → `PaymentPending` → `BookingStatusPanel` | RedirectingToCheckout, Checking, Slow, Paid, NotCompleted |
| Checklista „do rezerwowalności” | `OfferChecklist` + `PendingBookingsNotice` | NewMentor, Partial, SlotsTooSoon, Complete, WithPending |
| Link pokazany raz (kopiuj) | `InvitationLinkPanel`, `CopyField` | Default, Copied (komunikat `aria-live`, S10), ClipboardDenied, Dismissed (linku już nie ma) |

### 3.3 Kluczowe ekrany (stories `layout: "fullscreen"`, `stories/product/<E0x>/screens/`) i mapa stanów

Ekran = kompozycja komponentów pakietu (+ `AppHeader`), dane z fikstur specyfikacji; mapa stanów jako tabela JSX na stronie epiku (C14).

**E01:**
| Ekran | Stan → story |
|---|---|
| `/login` | formularz → `Login/Default`; zły e-mail/hasło („Invalid email or password”) → `Login/InvalidCredentials`; 429 z czasem ponowienia → `Login/RateLimited`; sieć → `Login/NetworkError` |
| `/register` | → `Register/Default`; e-mail zajęty (`conflict`) → `Register/EmailTaken`; hasło < 12 → `Register/PasswordTooShort` |
| `/register/mentor?token=` | ważny → `RegisterMentor/Default`; nieważny/użyty/wygasły (bez formularza) → `RegisterMentor/InvitationInvalid` |
| `/admin/invitations` | lista → `AdminInvitations/Default`; pusta → `/Empty`; po utworzeniu (link raz) → `/LinkShownOnce`; ładowanie/błąd → `/Loading`, `/Error` |
| `/mentor` | nowy mentor → `MentorHome/NewMentor`; częściowo → `/Partial`; rezerwowalny + link → `/Bookable`; (E02) z oczekującymi → `/WithPending` |
| `/mentor/profile` | edycja → `MentorProfile/Default`; puste ceny → `/NoPrices`; błędy pól → `/FieldErrors`; zapisywanie → `/Saving` |
| `/mentor/slots` | lista → `MentorSlots/Default`; pusto → `/Empty`; slot „too soon” → `/TooSoon`; odrzucony slot (24 h/odstęp) → `/SlotRejected`; usuwanie → `/DeleteConfirm`; dużo → `/Many` |
| `/mentors` | lista → `PublicMentors/Default`; filtr → `/Filtered`; brak wyników → `/NoResults`; nikt nie jest na liście → `/NobodyListed`; błąd → `/Error` |
| `/m/[slug]` | profil + sloty → `MentorPage/Default`; brak terminów → `/NoTimes`; nieznany slug → `/NotFound`; E01: *Book* wyłączony z wyjaśnieniem → `/BookingNotYetAvailable` (Q4) |

**E02:**
| Ekran | Stan → story |
|---|---|
| `/m/[slug]` (#29) | przyciski *Book 25/50 · cena* → `MentorPage/WithBooking`; gość → przekierowanie `/login?next=` (opis) |
| `/book/[slotId]` (#30) | → `BookSlot/Default`; walidacja pytania → `/QuestionInvalid`; wysyłanie → `/Submitting`; zajęty → `/SlotTaken`; 2 nieopłacone → `/TooManyUnpaid`; 503 → `/PaymentUnavailable`; sieć → `/NetworkError` |
| `/bookings/[id]` (#30, #32) | `Checking`, `Slow`, `Waiting`, `Confirmed`, `Declined`, `Expired`, `Refunded`, `RefundDelayed`, `PaymentNotCompleted`, `NotFound`, `Loading` |
| `/bookings` | → `MyBookings/Default`; filtr statusu → `/Filtered`; brak wyników → `/NoResults`; jeszcze żadnej (akcja *Find a mentor*) → `/NothingYet`; dużo → `/Many`; błąd → `/Error` |
| `/mentor/bookings` (#32) | oczekujące (wg `acceptBy`) → `MentorBookings/Default`; termin < 2 h → `/DeadlineSoon`; odrzucanie (dialog + powód) → `/Declining`; po terminie (`conflict`) → `/DeadlinePassed`; pusto → `/Empty`; błąd → `/Error` |

### 3.4 Partie (~6 pozycji, kolejność zależności)

| Partia | Zawartość | Zależy od |
|---|---|---|
| 1. Podstawy etapu 3 + dług | (1) MSW: instalacja i podpięcie (po zgodzie, 3.5); (2) `lib/format.ts`; (3) `lib/time.ts`; (4) `CrudForm` → `Field` + walidacja po opuszczeniu pola + fokus na pierwszym błędzie + pole hasła (C8); (5) `DataTable` → tokeny (`gap-*`, `type-meta` w paginacji) + wydzielony `Pagination`; (6) `feedback/*` → tokeny (`gap-in-group`, `type-*`) i wzorzec **Formularz** (CrudForm + MSW) | – |
| 2. E01 powłoka, auth, admin | `AppHeader` + `RoleNav` (dług: siatka kart „Coming soon”, fokus linków), `AccountMenu`, `CopyField`, `InvitationLinkPanel`, `InvitationStatusBadge`; wzorzec **Link pokazany raz**; ekrany `/login`, `/register`, `/register/mentor`, `/admin/invitations` | 1 |
| 3. E01 profil i oferta | `TagList`, `PublicWorkLinks`, `PriceList`, `MentorProfileHeader`, `MentorProfileForm`, `OfferChecklist`; wzorce **Kwota PLN**, **Checklista**; ekrany `/mentor`, `/mentor/profile` | 1, 2 |
| 4. E01 sloty i lista publiczna | `SlotTimeField`, `SlotList`, `AddSlotForm`, `MentorCard`, `ActiveFilters` + `ResultCount`; wzorce **Czas ze strefą**, **Potwierdzenie usunięcia**, **Lista z filtrami**; ekrany `/mentor/slots`, `/mentors`, `/m/[slug]`; strona epiku E01 (szkic mapy stanów) | 3 |
| 5. E02 rezerwacja i płatność | `SlotBookActions`, `BookingSummary`, `QuestionField`, `BookingForm`, `PaymentPending`, `BookingStatusBadge`, `BookingStatusPanel`; wzorce **Formularz** (instancja BookingForm), **Płatność**, **Status i następna akcja**, **Widok szczegółów**; ekrany `/m/[slug]` (Book), `/book/[slotId]`, `/bookings/[id]` | 4 |
| 6. E02 listy i decyzje mentora | `BookingQuestion`, `BookingRow`, `MentorBookingRow`, `AcceptDeadline`, `DeclineBookingDialog`, `PendingBookingsNotice`; wzorzec **Termin z odliczaniem**; ekrany `/bookings`, `/mentor/bookings`, `/mentor` (WithPending); strona epiku E02; kontrola kompletności map stanów | 5 |

Po każdej partii: lint, typecheck, `test:coverage` (100% – komponenty produktu i `lib/` są w `src/`), build, `build-storybook` (sprawdzenie stron), `test:storybook` (oba motywy), `lint:tokens`; stop i raport. Szacunek etapu 3: 26 komponentów produktu + 7 bloków ogólnych, ~11 stron wzorców, ~14 ekranów, ok. 300–340 nowych stories (×2 motywy w testach), ~45 testów interakcji, ~40 nowych plików testów jednostkowych.

### 3.5 MSW – do zatwierdzenia (S3)

- Pakiety (devDependencies `@devmentor/ui`, wersje dokładne): `msw@3.0.3`, `msw-storybook-addon@3.0.3`. Komenda: `npm install -D -E -w @devmentor/ui msw@3.0.3 msw-storybook-addon@3.0.3`, potem `npx msw init packages/ui/.storybook/public` (bez `--save`; plik `mockServiceWorker.js` w repo, serwowany przez istniejące `staticDirs`).
- Zgodność: msw 3 wymaga Node ≥ 22.12 (lokalnie 22.17, CI `node-version: 22` = najnowsza 22.x); opcjonalne peery TypeScript ≥ 5.9 (repo 6.0.3), Vite ≥ 6 (8.3.4), `graphql` – nieużywany, nie instalujemy. Addon: peer `storybook ^10`, `msw >=2`, bez własnych zależności. Uwaga: msw 3.0.3 opublikowany 2026-10-10 (9 dni), 3.0.0 to nowa wersja główna (2026-09-28) – alternatywy w Q1.
- Podpięcie: `.storybook/preview.tsx` – `initialize({ onUnhandledRequest: "error" })` + `loaders: [mswLoader]`; handlery per story w `parameters.msw.handlers`; wspólne handlery i fikstury w `stories/mocks/` (dane ze specyfikacji, odpowiedzi w kopercie `{ ok, data }` / `{ ok: false, error }`). Stany: sukces, `delay("infinite")` (oczekiwanie), 422 z `fieldErrors`, 409/503/500, `HttpResponse.error()` (brak sieci) – przez prawdziwy `apiCall`.
- Testy stories: `storybookTest` stosuje loadery z preview, więc MSW działa w Chromium w `test:storybook` (oba motywy); do `optimizeDeps.include` dochodzą `msw`, `msw/browser`, `msw-storybook-addon`. Do sprawdzenia w partii 1: czy plugin Vitest serwuje `staticDirs` (jeśli nie – `publicDir: ".storybook/public"` w `vitest.storybook.config.mts`).
- Pokrycie jednostkowe bez zmian: msw tylko w `.storybook/` i `stories/` (poza `packages/ui/src/**`), `test:coverage` go nie ładuje, `coverage.exclude` bez zmian; testy `apiCall` dalej mockują `fetch`. C16: reguła ESLint zabraniająca importu `msw` w `packages/ui/src/**`. `lint:tokens` skanuje `.storybook` (także `.js`) – jeśli wygenerowany worker da trafienia, wykluczenie tego jednego pliku w skrypcie (z testem).

### 3.6 Znany dług – gdzie trafia

| Dług | Partia | Uwagi |
|---|---|---|
| `CrudForm` bez `Field` (brak podpowiedzi, `aria-describedby`, „(optional)”, ikony błędu) + `space-y-*` | 1 | razem z wymaganiami wzorca formularza (walidacja po opuszczeniu pola, fokus na pierwszym błędzie) |
| `DataTable` – tokeny wiersza listy | 1 | komórki już mają `py/px-list-row` (B61); zostają `space-y-3`, `text-sm`, `gap-*` w kontenerze i paginacji → `gap-between-groups`, `type-meta`; paginacja wydzielona |
| `feedback/*` (`EmptyState` `gap-2`/`px-6 py-10`, `text-sm`) | 1 | nazwy tokenów; `ErrorMessage` z surowym `error.message` – komunikat z kodu błędu („co się stało i co zrobić”) w partii 1 |
| Siatka kart z „Coming soon” w `/admin` (A01, kontrast 2,88 : 1) | 2 | w DS: `RoleNav` tylko z istniejącymi pozycjami (R02.6/P12) i ekran admina w Storybooku; zmiana `packages/app/src/app/admin/page.tsx` poza DS (zasada 11) → „What is missing” + zgłoszenie (C17) |
| Niespójny fokus linków (obrys przeglądarki / cyan) | 2 | `RoleNav`/`AppHeader` i link powrotu z pierścieniem `ring-3 ring-ring/50` i celem ≥ `control-sm`; linki w kodzie app → „What is missing” |
| Strona główna (`page.tsx`: slate/cyan, hero, martwy CTA) | – | zostaje poza DS (S9, zasada 11) – „What is missing” |
| Placeholdery „Ada Lovelace”, tekst pustego stanu w `users-admin.tsx` | – | kod app (zasada 11) – „What is missing”; reguła „bez placeholdera-nazwy” w Content (etap 4) |
| Treść zależna od JS (`Loading…` bez końca) | – | architektura stron app (dane z serwera) – „What is missing” |

### 3.7 Propozycje C1–C17 (do decyzji)

| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| C1 | Komponenty produktu w `src/components/<concept>/<Name>.tsx` (PascalCase jak `backend/`), typy w `types.ts`; nowe eksporty addytywne `./components/*` i `./lib/*` (wpis w `BACKWARD_COMPATIBILITY.md`) | AGENTS.md (miejsce nr 3), spec E01 (`ui/src/components/mentors/` itd.) |
| C2 | Komponenty czysto prezentacyjne; dane i akcje przez propsy (`onSubmit → ApiResult`); czas przez `now` i `timeZone` | ui nie importuje core; deterministyczne testy (spec: `Clock`) |
| C3 | Kontrakt stanów danych: kontener ma loading/empty/error, liść ma `<Name>Skeleton`, „błąd” liścia = nie dotyczy (z uzasadnieniem) | prompt etap 3.1, S11 |
| C4 | `formatPrice` = `Intl.NumberFormat("en-US", { style: "currency", currency })` → „PLN 180.00”, `tabular-nums` | F6, D12, P2 |
| C5 | Data i godzina: `en-GB`, 24 h, „Tue, 4 Nov, 18:00” + etykieta strefy („Europe/Warsaw, UTC+1”) przy każdej godzinie | spec E01 Edge Cases (strefa przy każdym wyświetleniu); decyzja ostateczna na stronie Content |
| C6 | `MentorCard` = pozycja jednokolumnowej gęstej listy (`Item`: tytuł + linia metadanych, ceny po prawej), bez awatara, bez siatki kart; nazwa z spec zostaje | R01.1, R01.3, A01 (siatka 3 kart), A05 (ściana kart z awatarem) |
| C7 | `MentorProfileForm` jako osobny formularz na `Field` (tagi = checkboxy, linki = lista ≤ 5, ceny = `InputGroup` z „PLN”, *Show me on the public list* = `Switch`), bo `CrudForm` nie obsługuje tych pól | AGENTS.md („bespoke tylko gdy UX nie pasuje – powiedz dlaczego”) |
| C8 | `CrudForm`: przejście na `Field`, walidacja po opuszczeniu pola, fokus na pierwszym błędzie, `description`/`optional`, pole hasła z `z.string().meta({ input: "password" })` + `autocomplete` – zmiany addytywne w propsach | dług; prompt (wzorzec formularza); spec E01 UI/UX i Faza 1 krok 6 (pole hasła) |
| C9 | Bloki ogólne w `backend/`: `forms/CopyField`, `filters/ActiveFilters` + `ResultCount`, `tables/Pagination` (z `DataTable`), `layout/AppHeader` + `RoleNav` | AGENTS.md (miejsce nr 2), reguła „≥ 2 użycia” |
| C10 | Akcje powtarzane w wierszach (*Book*, *Accept*, *Delete*) bez akcentu (`outline`/`secondary`); akcent tylko na jednym elemencie ekranu wskazanym w mapie stanów | P5/K3, R01.5 – Q3 |
| C11 | W partii 4 (E01) `/m/[slug]` z wyłączonym *Book* i widocznym zdaniem dlaczego; w partii 5 zastąpione `SlotBookActions` | spec E01 UI/UX („disabled placeholder until #30”), B17 – Q4 |
| C12 | `AcceptDeadline`: data + czas względny („in 9 h”) liczony z `now`, odświeżany przez stronę co minutę (bez tykania sekund); < 2 h dodaje tekst „Decide soon” z ikoną, nie tylko kolor | R05/D07, P10 (spokój), WCAG 1.4.1 |
| C13 | `/dev/fake-checkout` i Stripe Checkout poza DS; w ekranach tylko stan przekierowania | spec E02 (narzędzie dev, strona hostowana) |
| C14 | Ekrany = stories kompozycyjne w `stories/product/<E0x>/screens/`, nieeksportowane z pakietu (strony to kod app); mapa stanów jako tabela JSX na stronie epiku | prompt etap 3.3, zasada 5, zasada 8 |
| C15 | MSW tylko tam, gdzie komponent woła API przez `apiCall` (formularze, akcje w dialogach, ekrany); reszta stories dostaje dane przez `args`; fikstury w `stories/mocks/` z danych spec (tagi z MENTOR_TAGS, ceny PLN, bez ocen i liczb hype) | zasada 7, S3 |
| C16 | ESLint: zakaz importu `msw` w `packages/ui/src/**` | pokrycie i granice pakietu |
| C17 | Dług aplikacji (siatka kart, linki, strona główna, placeholdery, JS-only) – w DS tylko komponenty i ekrany w Storybooku; zmiany w `packages/app` jako osobne zgłoszenia po etapie 3 | zasada 11, S9 |

### Pytania (etap 3)

- **Q1** MSW: zgoda na `msw@3.0.3` + `msw-storybook-addon@3.0.3`? Alternatywy: `msw@3.0.2` (16 dni na rynku) albo linia 2.x (`msw@2.15.0`, lipiec 2026), jeśli wolisz nie brać świeżej wersji głównej.
- **Q2** `PendingBookingsNotice` na `/mentor`: czy może pokazać liczbę oczekujących rezerwacji w zdaniu („2 bookings wait for your decision”), czy P10 („bez liczników”) wyklucza także liczbę w tekście (wtedy „Bookings wait for your decision — earliest by …”)?
- **Q3** Akcent na `/mentor/bookings` i `/m/[slug]` (wiele równorzędnych akcji): brak akcentu na ekranie, czy akcent na akcji przy rezerwacji z najbliższym terminem / najbliższym slocie (C10)?
- **Q4** Czy zostawić w Storybooku wersję E01 strony `/m/[slug]` z wyłączonym *Book* (C11), czy pokazać tylko docelową wersję z E02?
- **Q5** Pytanie z rezerwacji (R01.2: mono dla kodu): czysty tekst z zachowanymi łamaniami w kroju proporcjonalnym, czy bloki w potrójnych backtickach renderowane monospace (prosty parser bez markdownu)?

### Decyzje właściciela – plan etapu 3 (Arkadiusz, 2026-10-19)

- **Q1** tak – `npm install -D -E -w @devmentor/ui msw@3.0.3 msw-storybook-addon@3.0.3`, potem `npx msw init packages/ui/.storybook/public` (bez `--save`). Plan awaryjny, gdyby 3.0.3 nie działał: `msw@3.0.2`. Po instalacji sprawdzić `package.json` i lockfile, usunąć wszystko spoza planu (zasada 6).
- **Q2** tak – liczba może być w zdaniu („2 bookings waiting for your decision”); P10 zabrania tylko liczników-plakietek.
- **Q3** `/mentor/bookings` → akcent na *Accept* rezerwacji z najbliższym terminem decyzji; `/m/[slug]` → bez akcentu (równorzędne wybory).
- **Q4** tak – zostaje wersja E01 `/m/[slug]` z wyłączonym *Book* i widocznym powodem (C11).
- **Q5** pytanie = czysty tekst z zachowanymi łamaniami, krój proporcjonalny (spec E02: „plain text”, bez Markdownu); „monospace dla bloków kodu w potrójnych backtickach” jako propozycja dla przyszłej specyfikacji sesji – wpis w „What is missing”.
- **C1–C17** przyjęte w całości.
- „dalej” → partia 1.

## Etap 3 – partia 1, wynik (2026-10-19)

MSW + podpięcie, `lib/format`, `lib/time`, `CrudForm` na `Field`, `DataTable` + wydzielony `Pagination` i bloki `feedback/` na tokenach, `ErrorMessage` bez surowego `error.message`, wzorzec **Formularz**. Nic nie jest zacommitowane.

### Instalacja MSW (Q1) – odstępstwo od komendy, do wiadomości
- `npm install -D -E -w @devmentor/ui msw@3.0.3 msw-storybook-addon@3.0.3` (także każdy pakiet osobno, także `msw@3.0.2` w dry-run) **wywraca npm 10.9.2** (`Cannot read properties of null (reading 'edgesOut')` w `#loadPeerSet` arborist – ten sam błąd co w etapie 1). Plan awaryjny 3.0.2 nie pomaga – błąd dotyczy npm, nie wersji msw.
- Próba z `--legacy-peer-deps` usunęła z lockfile m.in. `vite`, `typescript`, `rolldown` (880 linii) – **cofnięta w całości** z kopii lockfile i `package.json` sprzed instalacji (kopia w scratchpadzie, bez `git stash`), `npm install` przywrócił drzewo 1:1 (`cmp` = identyczny lockfile).
- Skuteczna droga: ta sama komenda przez `npx npm@11 install --package-lock-only --ignore-scripts …` na **kopii** `package.json`-ów i lockfile w scratchpadzie → porównanie: 33 nowe wpisy (wyłącznie drzewo msw: `@mswjs/interceptors`, `@inquirer/*`, `yargs`…), wpis workspace ui, żadna istniejąca wersja nie zmieniona, nic nie usunięte → skopiowane do repo + `npm install` (npm 10). Wynik: `package.json` ui +2 linie (`msw` 3.0.3, `msw-storybook-addon` 3.0.3, dokładne), lockfile **+453 linie, 0 usuniętych**. `npm audit`: te same 10 „high” co przed instalacją, nic z msw.
- `npx msw init packages/ui/.storybook/public --no-save` → `mockServiceWorker.js` (bez wpisu w `package.json`). Plik wykluczony z ESLint (generowany); `lint:tokens` go skanuje – 0 trafień.
- Różnice API względem planu 3.5: addon 3.x dla CSF 3 to `mswLoader(setup)` z `msw-storybook-addon/csf3` (nie `initialize()`), a msw 3 zamienił `onUnhandledRequest` na `onUnhandledFrame({ frame, defaults })`. Wbudowany setup addonu nadal używa starej opcji (ignorowanej przez msw 3) – dlatego własny `startMockApi` w `preview.tsx`: błąd tylko dla nieobsłużonych żądań `/api/*`, reszta przechodzi.
- Vitest: `storybookTest` serwuje `staticDirs`, więc worker działa w `test:storybook` bez `publicDir`; `optimizeDeps` + `msw`, `msw/browser`, `msw-storybook-addon/csf3`, `zod`. Sprawdzone też w zbudowanym Storybooku (story `Patterns/Form/Success` dostaje odpowiedź z mocka).

### Co powstało / zmieniło się
- `src/lib/format.ts` (+ testy): `formatPrice` → „PLN 180.00” (twarda spacja), `formatDateTime` → „Wed 4 Nov, 18:00” (en-GB, 24 h – uwaga: Intl en-GB daje „Wed 4 Nov”, bez przecinka po dniu tygodnia, nie „Tue, 4 Nov” jak w C5), `formatUtcOffset`/`formatZoneLabel` → „Europe/Warsaw, UTC+1”, `formatRelative` → „in 9 h”, „in 45 min”, „in 3 days”, „20 min ago”, „now”.
- `src/lib/time.ts` (+ testy): `localToUtc(date, time, zone)` – czas nieistniejący (29.03.2026 02:30 Warszawa) → `nonexistent`, dwuznaczny (25.10.2026 02:30) → pierwsze wystąpienie + `ambiguous: true`, błędne daty → `invalid`; `offsetAt`, `browserTimeZone`. Tylko Intl, bez biblioteki dat.
- Eksport addytywny `./lib/*` (C1) + wpis w `BACKWARD_COMPATIBILITY.md`. `./components/*` dojdzie z pierwszym komponentem produktu (partia 2).
- `backend/api/describeApiError.ts` (+ testy) i `ErrorMessage` z propsem `error: ApiError` (C18); `message` zostaje (zgodność z app).
- `CrudForm`: `Field`/`FieldLabel`/`FieldDescription`/`FieldError` w `FieldGroup`, `description`, `optional`, `autoComplete`, pole hasła z `meta({ input: "password" })`, walidacja po opuszczeniu zmienionego pola i ponowna przy pisaniu, fokus na pierwszym błędzie (albo na komunikacie formularza), `aria-describedby`, przycisk *Saving…* ze spinnerem i `aria-busy`, `errorTitle`; odstępy `gap-between-groups` / `gap-in-group`.
- `backend/tables/Pagination.tsx` (nowy, wydzielony; `nav` z `label`, `type-meta`, `tabular-nums`, zawija się na 320 px); `DataTable`: kontener `gap-in-group`, `error` przyjmuje też `ApiError`.
- `EmptyState`, `LoadingMessage`: `gap-in-group`, `px-panel`, `py-section`, `type-label`/`type-body`.
- ESLint (C16): zakaz `msw`/`msw-storybook-addon` w `packages/ui/src/**` (sprawdzone na próbce w `lib/` i `components/ui/`).
- Storybook: `stories/mocks/api.ts` (`respondOk`, `respondError`, `respondNever`, `respondNetworkError`), `stories/mocks/fixtures.ts` (rejestracja wg spec E01, zaproszenie, lista użytkowników – dane zmyślone, bez ocen i liczb); wzorzec `Patterns/Form` (MDX z regułami i źródłami + 10 stories: Default, ValidationOnBlur, ValidationOnSubmit, Submitting, FieldErrorFromServer, RateLimited, ServerError, NetworkError, Success, Narrow320); strony 13-sekcyjne + stories dla `CrudForm`, `DataTable`, `Pagination`, `EmptyState`, `ErrorMessage`, `LoadingMessage` w `Primitives/Panel blocks/` (C23).
- `packages/ui/AGENTS.md`: nowe pliki, MSW w stories, `ErrorMessage error=…`, pola `CrudForm`.

### Propozycje C18–C28 (materiały milczą; wdrożone zachowawczo i odwracalnie – do decyzji)
| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| C18 | `describeApiError`: kody techniczne (`network_error`, `invalid_response`, `internal_error`) dostają tekst „co się stało i co zrobić” („No connection – We could not reach DevMentor. Check your connection and try again.”, „Something went wrong on our side – Try again in a moment.”); kody domenowe zachowują komunikat serwera pod tytułem akcji. `ErrorMessage error=…`, `DataTable error` przyjmuje `ApiError` (addytywnie) | audyt (surowy `error.message`), prompt etap 4 (Content: błędy) |
| C19 | „(optional)” w `CrudForm` tylko z jawnego `optional: true`, nie wyliczane ze schematu – schematy edycji bywają w całości opcjonalne i każda etykieta dostałaby dopisek | odpowiedź 2.5 |
| C20 | Walidacja po opuszczeniu pola tylko dla pól zmienionych względem wartości początkowej; pole z błędem sprawdzane ponownie przy każdej zmianie (komunikat znika od razu po poprawie) | prompt etap 3 (walidacja po opuszczeniu pola) |
| C21 | `autocomplete`: hasło domyślnie `current-password` (rejestracja podaje `new-password`); inne pola tylko z konfiguracji – bez domyślnego `email`, bo w adminie wpisuje się cudzy adres | WCAG 1.3.5, spec E01 („autocomplete set”) |
| C22 | Paginacja w roli metadanych (12 px, `type-meta`, `tabular-nums`) zamiast 14 px; landmark `nav` z nazwą; „0–0 of 0” zamiast „1–0 of 0” | P2, WAI-ARIA |
| C23 | Strony bloków panelu w menu jako `Primitives/Panel blocks/<Name>` (drzewo z etapu 0 nie ma osobnej grupy) | drzewo menu S/etap 0 |
| C24 | `CrudForm` – nowy prop `errorTitle` (domyślnie „Could not save”), żeby tytuł błędu nazywał akcję („Could not create the account”) | prompt etap 4 (Content: błędy) |
| C25 | `EmptyState`: wewnętrzny odstęp 16/32 px (`px-panel`/`py-section`) zamiast 24/40 px; `LoadingMessage` 32 px w pionie zamiast 40 – zmiana wyglądu w `/admin/users` | T8 (tylko tokeny odstępów) |
| C26 | Przycisk wysyłania `CrudForm` ze spinnerem (`aria-hidden`) obok „Saving…” – kompozycja B18 | B18 |
| C27 | Gdy serwer odrzuca formularz bez pola, fokus idzie na kontener komunikatu (`tabIndex=-1`, bez obrysu – komunikat sam jest wyraźny) | prompt etap 3 (fokus na błędzie), WCAG 2.4.3 |
| C28 | Na stronach Docs story z `play` pokazują stan początkowy (play działa tylko w widoku story) – zamiast podglądów stanów po interakcji linki do stories (Form, CrudForm) | zasada 8 („każdą stronę sprawdź”) – podgląd nie może udawać stanu |

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK (0 ostrzeżeń) |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 213 testów (+43), 100% we wszystkich metrykach (500/327/130/447) |
| `npm run build` | OK |
| `npm run build-storybook` | OK; 7 nowych stron w zbudowanym Storybooku (Chromium, 1440 px): bloki po 13 sekcji, Form 5 sekcji wzorca, tabele renderują się jako tabele, bez błędów strony; worker MSW obecny w `storybook-static/` |
| `npm run test:storybook` | OK – 382/382 (191 stories × 2 motywy; 39 nowych stories, 16 nowych testów interakcji), a11y bez naruszeń |
| `npm run lint:tokens` | OK – 0 wartości spoza tokenów (133 pliki) |
| `npm run test:integration` | OK – 11/11 (uruchomione dodatkowo, Docker) |

Znalezione i naprawione po drodze: `{things}` w treści MDX (`LoadingMessage`) wywracał stronę Docs (MDX traktuje klamry jako JS) – sprawdzenie zbudowanych stron to złapało.

### Sprawdzenie na żywej aplikacji (`next dev -p 3102`, `NEXT_DIST_DIR=.next-ds-check`, zatrzymany, katalog usunięty)
- `/admin`, `/admin/users` (1440 i 320 px): `CrudForm` na `Field` – etykiety, ikona i tekst błędu, czerwona etykieta przy błędzie; po pustym wysłaniu fokus na *Name*, `aria-describedby` wskazuje błąd, błąd znika przy pisaniu; utworzenie użytkownika działa; `DataTable` z nową paginacją (`nav` obecny); przy 320 px brak przewijania strony w bok; bez błędów JS.
- **Znalezisko poza DS (kod core/app, nie zmieniany):** duplikat e-maila w `POST /api/users` na tym serwerze dev zwraca **500 `internal_error`** zamiast 409 – w logu `ConflictError … "msg":"Unhandled API error"`, powtarzalne także `curl`-em. `test:integration` (świeży serwer na 3100, efemeryczna baza) ten sam przypadek przechodzi z 409. Prawdopodobnie dwie kopie klasy `AppError` w chunkach Turbopack (`instanceof` zawodzi) – pokrewne #16; przyczyna niesprawdzona. Skutek w UI: zamiast „Internal server error” widać teraz „Something went wrong on our side – Try again in a moment.” (C18), komunikatu przy polu nie ma, bo 500 nie niesie `fieldErrors`. Do osobnego zgłoszenia.
- Utworzone w lokalnej bazie dev (dozwolone): 3 × „Ds Check User” (`ds-check-<znacznik>@devmentor.test`) i „Ds Check Dup” (`seeded.mentor@devmentor.test`, mentee – próbka `curl`); zostawione.
- Ciemny motyw w aplikacji – nie sprawdzony (brak przełącznika, S16); w Storybooku oba motywy przechodzą testy.

### Czego nie sprawdzono
- Ręczna klawiatura w managerze Storybooka i czytnik ekranu na żywo (tylko testy play + axe).
- `npm run storybook` (serwer dev) – tylko build statyczny i testy Vitest.
- Prawdziwe urządzenie dotykowe.

### Do „What is missing” (etap 4)
- Q5: monospace dla bloków kodu w potrójnych backtickach w pytaniu – propozycja do przyszłej specyfikacji sesji.
- App: `users-admin.tsx` przekazuje do `DataTable` `result.error.message` (string) – przejście na `error={result.error}` (C18) to zmiana w app.
- ~~App/core: 409 → 500 przy duplikacie e-maila na serwerze dev~~ – koordynator: na świeżym serwerze dev jest 409; 500 tylko na długo działającym serwerze z HMR (zdublowana klasa `AppError` po przeładowaniach) – dopisane do #16, bez osobnego zgłoszenia i bez wpisu w „What is missing”.
- App: placeholdery „Ada Lovelace”/„ada@example.com” i pusty stan „…with the button above” w `users-admin.tsx` (bez zmian – zasada 11).

### Następny krok
Decyzje C18–C28, potem partia 2 (E01 powłoka, auth, admin: `AppHeader` + `RoleNav`, `AccountMenu`, `CopyField`, `InvitationLinkPanel`, `InvitationStatusBadge`, wzorzec „Link pokazany raz”, ekrany `/login`, `/register`, `/register/mentor`, `/admin/invitations`).

### Decyzje C18–C28

Zatwierdzone przez Arkadiusza 2026-10-19, wszystkie w wersji wdrożonej w partii 1.

## Etap 3 – partia 2, wynik (2026-10-19)

Powłoka E01 (`AppHeader` + `RoleNav`, `PageLayout`, `AccountMenu`), logowanie i rejestracja (`/login`, `/register`, `/register/mentor` ze stanami zaproszenia), zaproszenia admina (`InvitationLinkPanel` z `CopyField`, `InvitationStatusBadge`), ekran `/admin` bez siatki kart, wzorzec „Link shown once”, mapa stanów ekranów E01. Nic nie jest zacommitowane. Brak nowych zależności i komend CLI.

### Co powstało
- `src/backend/layout/`: `links.tsx` (`navLinkClassName` – jeden styl linku nawigacji: `muted-foreground`, hover i bieżąca strona `bg-muted`, pierścień `ring-3 ring-ring/50` jak przyciski, 28/40 px; `RenderLink` + `renderAnchor`), `RoleNav.tsx` (`nav` z nazwą, `aria-current="page"`, pusta lista → nic), `AppHeader.tsx` (znak słowny, `RoleNav`, miejsce na konto, linia 1 px, `navLabel`), `PageLayout.tsx` (nagłówek + `main` z jednym `h1`, szerokość `content` 1024 px / `narrow` 384 px).
- `src/backend/forms/CopyField.tsx`: wartość tylko do odczytu (mono), *Copy link*, potwierdzenie słowami w `role="status"` (bez toastu, S10), przy odmowie schowka zaznaczenie tekstu i instrukcja Ctrl+C/⌘C, zaznaczenie całości przy fokusie, `autoFocus`.
- `src/components/auth/AccountMenu.tsx` (+ `AccountMenuSkeleton`, typ `SessionUser`): gość – *Log in* (link nawigacji) i *Register* (link w stylu przycisku outline); zalogowany – imię (ucięte przy długim, pełne w `title`) i *Log out* (busy, błąd słowami; 401 = już wylogowany).
- `src/components/mentors/InvitationLinkPanel.tsx` (region z tytułem, opis „wyślij sam, pokazany raz, ważny do … (strefa)”, `CopyField` z fokusem, *Done*), `InvitationStatusBadge.tsx` (*Pending* `secondary`, *Used*/*Expired* `outline`), typy `Invitation`, `InvitationStatus` (re-eksport z komponentu).
- Eksport addytywny `./components/*` (C1) + wpis w `BACKWARD_COMPATIBILITY.md`.
- Stories: bloki `Primitives/Panel blocks/{RoleNav, AppHeader, PageLayout, CopyField}`; produkt `Product/E01/{AccountMenu, InvitationLinkPanel, InvitationStatusBadge}` – każdy ze stroną 13 sekcji; ekrany `Product/E01/Screens/{Login, Register, RegisterMentor, AdminHome, AdminInvitations}` (pełny ekran, MSW tam, gdzie ekran woła API) + `Product/E01/Screens/State map` (stan → story); wzorzec `Patterns/Link shown once`. Fikstury: logowanie, rejestracja mentora, nawigacja ról, zalogowani, lista i nowe zaproszenie.

### Audyt admina w design systemie (zasada 11 – kod app bez zmian)
- Siatka kart z „Coming soon” → ekran `AdminHome`: `RoleNav` tylko z istniejącymi pozycjami (*Users*, *Invitations*) + gęsta lista sekcji (`Item` + `ItemLink`), bez kart i bez „Coming soon” (test `KeyboardFocus` sprawdza brak tekstu).
- Jeden styl fokusu linków: `navLinkClassName` (nawigacja, znak słowny, linki konta) = ten sam pierścień co przyciski i pola; linki w treści – `link-text`; wiersze – pierścień `Item`. Link powrotu „← Admin panel” (18 px) zastępuje nawigacja roli z celem 28/40 px.
- W app: `/admin`, `/admin/users` nadal stare – „What is missing” + zgłoszenie po etapie 3 (C17).

### Propozycje C29–C40 (materiały milczą; wdrożone zachowawczo i odwracalnie – do decyzji)
| # | Propozycja | Źródło / dlaczego |
|---|---|---|
| C29 | Linki w blokach przez prop `renderLink` (app podaje `Link` z Next.js), domyślnie zwykłe `<a>` – ui nie importuje `next` | `AGENTS.md` (granice pakietów) |
| C30 | `AccountMenu` bez menu rozwijanego: imię + *Log out* obok siebie (dwie akcje nie potrzebują menu) | spec E01 UI/UX („the user's name and Log out”), zasada 6 |
| C31 | Nowy blok `PageLayout` (nagłówek, `main`, jeden `h1`, szerokość 1024/384 px, odstęp sekcji 32 px) – rama każdego ekranu | F2, T8, A01 (bez hero) |
| C32 | Wartość w `CopyField` krojem mono (`type-code`) – link z tokenem czyta się znak po znaku | R01.2 (ścieżki, identyfikatory) |
| C33 | Wylogowanie z odpowiedzią 401 (sesja już wygasła po 24 h) traktowane jak udane – bez komunikatu o błędzie | spec E01 (sesja 24 h bez odświeżania) |
| C34 | Jeden styl linku nawigacji (`navLinkClassName`): tekst wyciszony, hover i bieżąca strona `bg-muted` + `aria-current`, pierścień jak przyciski | audyt (trzy style fokusu), T4, WCAG 1.4.1 |
| C35 | `InvitationLinkPanel` zastępuje formularz do *Done*; *Done* w akcencie (jedyna główna akcja w tym momencie); fokus na linku; tekst „Copy the link now and send it to the mentor yourself. It is shown only once…” | spec E01 UI/UX, P5/K3, D15 |
| C36 | `/register/mentor` pokazuje zaproszony e-mail („You were invited as …”) – wymaga, by strona odczytała zaproszenie po stronie serwera (spec mówi tylko, że nieważny link pokazuje komunikat bez formularza) | spec E01 UI/UX – Q7 |
| C37 | Ekran `/admin` w DS: krótka nawigacja + gęsta lista sekcji z jednozdaniowym opisem zamiast kart | audyt, R01.1, R02.6/P12, A01 |
| C38 | Komunikat nieważnego zaproszenia: tytuł „This invitation is no longer valid” + „Links work once and for 14 days. Ask the DevMentor founders for a new one.” (`Alert` z `role="status"` – obecny od wczytania strony) | spec E01 Edge Cases, B42 |
| C39 | Pozycje nawigacji ról: gość *Mentors*; mentee *Mentors*, *My bookings*; mentor *Overview*, *Profile*, *Slots*, *Bookings*; admin *Users*, *Invitations* (tylko strony ze specyfikacji) | R02.6/P12, specyfikacje E01/E02 |
| C40 | *Register* w nagłówku jako link w stylu przycisku `outline`, *Log in* jako link nawigacji – akcent zostaje dla głównej akcji strony | P5/K3 |

### Pytania
- **Q6** Ponowne zaproszenie e-maila, który ma już oczekujące zaproszenie: spec E01 tego nie określa. Story z odmową 409 usunąłem, żeby nie wymyślać reguły. Czy drugie zaproszenie ma być odrzucane, czy tworzyć nowe (stare dalej ważne / unieważnione)?
- **Q7** (do C36) Czy `/register/mentor` może pokazać zaproszony e-mail? Wymaga to odczytu zaproszenia na serwerze (spec ma tylko `POST /api/auth/register/mentor`); bez tego strona mówi tylko „You were invited to join as a mentor”.

### Wyniki sprawdzeń
| Komenda | Wynik |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test:coverage` | OK – 237 testów (+24), 100% we wszystkich metrykach (547/370/146/491) |
| `npm run build` | OK |
| `npm run build-storybook` | OK; 9 nowych stron w zbudowanym Storybooku (Chromium): komponenty po 13 sekcji, tabele jako tabele, bez błędów strony; wszystkie linki `?path=` ze stron MDX istnieją w indeksie stories |
| `npm run test:storybook` | OK – 512/512 (256 stories × 2 motywy; 65 nowych stories, 28 nowych testów interakcji), a11y bez naruszeń |
| `npm run lint:tokens` | OK – 0 wartości spoza tokenów (164 pliki) |

Ekrany `AdminInvitations`, `AdminHome`, `Login`, `RegisterMentor/InvitationInvalid` obejrzane w zbudowanym Storybooku przy 1440 i 320 px: bez przewijania strony w bok (tabela zaproszeń przy 320 px przewija się w swojej ramce – jak `DataTable`). Poprawione po obejrzeniu: znak słowny wyrównany do lewej krawędzi treści (`-ml-2` względem paddingu linku); z opisu ekranu usunięty identyfikator decyzji „(D11)” – identyfikatory tylko w dokumentacji, nie w treści produktu.

Znalezione i naprawione po drodze: `PerRole` w `AppHeader` (cztery nagłówki na jednej stronie) łamał axe `landmark-unique`/banner – każdy nagłówek w osobnej, nazwanej sekcji + nowy prop `navLabel`; story „wylogowanie przy wygasłej sesji” ujawniło, że 401 pokazywał błąd – stąd C33.

### Czego nie sprawdzono
- Aplikacja na żywo: nie uruchamiałem serwera dev – partia nie zmienia niczego, czego używa app (nowe bloki i komponenty nie są jeszcze podpięte; `CrudForm`/`DataTable` bez zmian od partii 1).
- Ręczna klawiatura w managerze Storybooka, czytnik ekranu na żywo, urządzenie dotykowe.
- Prawdziwy schowek w przeglądarce użytkownika (testy podmieniają `navigator.clipboard`).

### Do „What is missing” (etap 4)
- App: `/admin` (siatka kart, „Coming soon”, kontrast 2,88 : 1), link „← Admin panel”, fokus linków – do przepięcia na `AppHeader`/`RoleNav`/`PageLayout` (zasada 11, osobne zgłoszenie).
- Spec E01: zachowanie przy ponownym zaproszeniu tego samego e-maila (Q6); odczyt zaproszenia na stronie `/register/mentor` (Q7).

### Decyzje właściciela – partia 2 (Arkadiusz, 2026-10-20)
- **C29–C40** przyjęte w całości.
- **Q6** Ponowne zaproszenie e-maila z oczekującym zaproszeniem tworzy nowe i unieważnia stare (nowa kolumna `revokedAt`, nullable). Zapisane w spec E01 (model danych, tabela API, edge cases).
- **Q7** `/register/mentor` pokazuje zaproszony e-mail przez nowy `GET /api/auth/invitations/[token]` → `{ email, expiresAt }`; każdy nieważny token (użyty, wygasły, unieważniony, nieznany) → ten sam ogólny `not_found`. Zapisane w spec E01.
- Wpis „What is missing” o Q6/Q7 nieaktualny – rozstrzygnięte w specyfikacji.

### Partia 2 – Q6/Q7 w design systemie (2026-10-20)
- `InvitationStatus` + `revoked`; `InvitationStatusBadge` *Revoked* (`outline`), test i strona (status, treść, API).
- Ekran `AdminInvitations/ReinviteRevokesOld` (MSW ze stanem: po POST lista zwraca nowe zaproszenie i stare jako *Revoked*); wiersz w mapie stanów i we wzorcu „Link shown once”.
- Ekran `RegisterMentor` czyta zaproszenie przez `GET /api/auth/invitations/[token]` (MSW): `Loading` (szkielety, `role="status"`), `Default` (pokazany e-mail), `InvitationInvalid` (404 → komunikat bez formularza), `UsedMeanwhile`, `Success`, `Narrow320`; mapa stanów zaktualizowana.
- Sprawdzenia: lint, typecheck, `test:coverage` (238 testów, 100%), build, `build-storybook` (linki `?path=` w MDX – wszystkie istnieją w indeksie), `test:storybook` (516/516 – 258 stories × 2 motywy, +2 stories), `lint:tokens` (0, 164 pliki) – wszystkie OK. Nic nie zacommitowane.
