# POSTĘP: design system DevMentor (Storybook)

Plik roboczy zadania z `lekcja-06/prompt-storybook.md`. Nowa sesja: przeczytaj prompt i ten plik, kontynuuj od „Następny krok”.

## Stan etapów

| Etap | Stan |
|---|---|
| 0. Inwentaryzacja i plan | zakończony 2026-10-19 – decyzje właściciela zapisane niżej |
| 1. Fundamenty | zakończony 2026-10-19 – F1 wdrożone, F2–F6 zapisane; czeka na „dalej” |
| 2. Komponenty bazowe | nie rozpoczęty |
| 3. Komponenty produktu, wzorce, ekrany | nie rozpoczęty |
| 4. Strony, które uczą | nie rozpoczęty |
| 5. Sprawdzenie i raport | nie rozpoczęty |

## Następny krok

Po „dalej” → etap 2 (komponenty bazowe, partie po ~6; najpierw lista różnic względem bazy: wysokość, promienie, obramowania, padding, fokus).
Nic nie jest zacommitowane – commit robi właściciel.

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
