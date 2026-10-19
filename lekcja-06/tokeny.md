# Tokeny: DevMentor

- Data: 2026-10-19
- Zatwierdził: Arkadiusz (każda decyzja T1–T16 i kolor akcentu osobno)
- Źródło decyzji: `lekcja-06/referencje.md` (R01.x, R02.x, A01–A05, K1–K4, P1–P21)
- Istniejące tokeny: shadcn base-nova (`:root` i `.dark`) w `packages/app/src/app/globals.css`; `packages/ui/components.json` (`baseColor: neutral`). Fonty: Geist i Geist Mono (`packages/app/src/app/layout.tsx`).
- Nazwy shadcn są już znaczeniowe (background, foreground, primary, muted…), więc decyzje mapujemy na nie; nowe tokeny tylko tam, gdzie nic nie pasuje (odstępy, wiersz listy, strumień wiadomości).
- Uwaga o nazwach: „kolor akcentu” DevMentora to shadcn `--primary`. Token shadcn `--accent` to neutralne tło hover, nie nasz akcent.
- Ciemny motyw: klasa `.dark` istnieje, ale nic jej nie ustawia; wartości ciemne są zaprojektowane i sprawdzone, sam tryb ciemny pozostaje luką (patrz referencje).
- Ten plik jeszcze niczego nie zmienia w kodzie; `globals.css` zostanie zaktualizowany w ćwiczeniu 3.

## Kolor akcentu (decyzja)

Opcja A – morski (teal), zatwierdził: Arkadiusz.

- Jasny motyw: Tailwind `teal-800` = `oklch(0.437 0.078 188.216)` (#005f5a).
- Ciemny motyw: Tailwind `teal-400` = `oklch(0.777 0.152 181.912)` (#00d5be), tekst na nim stone-950.
- Dlaczego: najdalej od czerwieni (destructive) i od fioletu (A01, K2); spokojny chłodny akcent na ciepłych szarościach (R01.4). Nie wynika z żadnej referencji – to wybór właściciela spośród trzech opcji (morski, niebieski sky, bursztyn).
- Odcień -800 zamiast -700 w jasnym motywie, bo przy -700 hover przycisku `bg-primary/80` z białym tekstem spada do 3,70 : 1.

## Tabela tokenów

| Token | Warstwa | Wartość | Pochodzenie | Gdzie używać | Gdzie nie używać |
|---|---|---|---|---|---|
| `--color-stone-50` … `--color-stone-950` | surowa | paleta Tailwind stone: 50 #fafaf9, 100 #f5f5f4, 200 #e7e5e4, 300 #d6d3d1, 400 #a6a09b, 500 #79716b, 600 #57534d, 700 #44403b, 800 #292524, 900 #1c1917, 950 #0c0a09 | R01.4 / P4, T1 | tylko w pliku tokenów, jako źródło tokenów znaczeniowych | bezpośrednio w komponentach i stronach |
| `--color-teal-800`, `--color-teal-400` | surowa | paleta Tailwind teal (#005f5a, #00d5be) | wybór akcentu (opcja A) | tylko w pliku tokenów | bezpośrednio w komponentach |
| `--color-red-800` | surowa | paleta Tailwind red-800 `oklch(0.444 0.177 26.899)` (#9f0712) | T6 (zmienione z red-700) | tylko w pliku tokenów | bezpośrednio w komponentach |
| `--color-red-300` | surowa | paleta Tailwind red-300 `oklch(0.808 0.114 19.571)` (#ffa2a2) | F1 (2026-10-19) | tylko w pliku tokenów | bezpośrednio w komponentach |
| `--background` | znaczeniowa | jasny: stone-50; ciemny: stone-950 | R01.4 / P4, T13 | tło strony | pod listami i panelami (tam `--card`) |
| `--card`, `--popover` | znaczeniowa | jasny: white; ciemny: stone-900 | R01.1, R01.3, T13 | powierzchnia list, paneli, widoku sesji, menu | jako „karta z cieniem” do grupowania pojedynczych pozycji (P3) |
| `--foreground`, `--card-foreground`, `--popover-foreground` | znaczeniowa | jasny: stone-950; ciemny: stone-50 | R01.1 | tekst główny, tytuły wierszy, linki w treści (T11) | – |
| `--muted` | znaczeniowa | jasny: stone-100; ciemny: stone-800 | R01.4 / P4 | tło nagłówka tabeli, hover wiersza, wyciszone tła | jako tło dużych powierzchni zamiast `--background` |
| `--muted-foreground` | znaczeniowa | jasny: stone-600; ciemny: stone-400 | R01.1 (linia metadanych), R02.3 (godzina), T2 | metadane wiersza, godziny wiadomości, tekst drugorzędny | etykiety akcji, tekst, który trzeba przeczytać, by działać |
| `--secondary`, `--secondary-foreground` | znaczeniowa | jasny: stone-100 / stone-900; ciemny: stone-800 / stone-50 | P4 | przyciski drugorzędne, odznaki statusu (T10) | główna akcja ekranu |
| `--accent`, `--accent-foreground` | znaczeniowa | jasny: stone-100 / stone-900; ciemny: stone-800 / stone-50 | P4 | neutralne tło hover i zaznaczenia w menu | jako „kolor akcentu” (to `--primary`) |
| `--border` | znaczeniowa | jasny: stone-200; ciemny: white 10% (bez zmian) | R01.3, T5 | linie 1 px między wierszami, ramka listy i panelu | obrys pól formularza (tam `--input`) |
| `--input` | znaczeniowa | jasny i ciemny: stone-500 | WCAG 1.4.11, T3 | obrys pól formularza i selectów | separatory wierszy |
| `--ring` | znaczeniowa | jasny: stone-900; ciemny: stone-100 | dostępność (fokus), T4 | pierścień fokusu (`ring-ring/50`) | jako akcent – akcent zostaje na jednym elemencie (P5) |
| `--primary`, `--primary-foreground` | znaczeniowa | jasny: teal-800 / white; ciemny: teal-400 / stone-950 | R01.5 / P5, K3, wybór akcentu | jedna wyróżniona rzecz na ekranie: główna akcja i jej status (zaakceptuj / odrzuć do…, zapłać, wejdź do sesji) | linki w treści (T11), odznaki statusu (T10), ikony, dekoracje, drugi przycisk na tym samym ekranie |
| `--destructive` | znaczeniowa | jasny: red-800; ciemny: red-300 (F1, wcześniej shadcn `oklch(0.704 0.191 22.216)`) | T6, F1 | błędy, odrzucenie, akcje nieodwracalne | jako akcent lub wyróżnienie |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-ring` | znaczeniowa | = `--background`, `--foreground`, `--border`, `--ring` | R02.6 / P12, T14 | krótka nawigacja ról | – |
| `--sidebar-primary`, `--sidebar-primary-foreground` | znaczeniowa | = `--primary`, `--primary-foreground` (usuwa obecne `oklch(0.488 0.243 264.376)` w `.dark`) | A01, K2, T14 | aktywna pozycja nawigacji | – |
| `--sidebar-accent`, `--sidebar-accent-foreground` | znaczeniowa | = `--accent`, `--accent-foreground` | P4, T14 | hover w nawigacji | – |
| `--chart-1` … `--chart-5` | znaczeniowa | bez zmian | brak referencji, T16 | – (nieużywane) | – |
| `--radius` | znaczeniowa | 0.375rem (6 px); pochodne: sm 3,6, md 4,8, lg 6, xl 8,4, 2xl 10,8, 3xl 13,2, 4xl 15,6 px | A01 / P13, T7 | wszystkie zaokrąglenia przez skalę `rounded-*` | lokalne zwiększanie promienia; promień ponad `xl` poza awatarami |
| `--font-mono` | znaczeniowa | Geist Mono (istniejący) | R01.2 / P2 | kod, ścieżki, nazwy plików, gałęzi, wersje | nagłówki, liczby, „terminalowy” styl całości |
| `--font-sans` | znaczeniowa | Geist (istniejący) – stan obecny, nie decyzja | luka (krój tekstu), T16 | tekst interfejsu i treści | – |
| `--space-in-group` | znaczeniowa (nowy) | 8 px | R01.1 (gęsto), T8 | odstęp między elementami w jednej grupie | między sekcjami |
| `--space-between-groups` | znaczeniowa (nowy) | 16 px | K1, T8 | odstęp między grupami w panelu | wewnątrz grupy |
| `--space-panel` | znaczeniowa (nowy) | 16 px | R01.3, T8 | wewnętrzny padding panelu i listy | odstęp między wierszami listy |
| `--space-section` | znaczeniowa (nowy) | 32 px | K1, T8 | odstęp między sekcjami strony | wewnątrz panelu |
| `--list-row-py` | komponentu (nowy) | 8 px | R01.1, T9 | pionowy padding wiersza gęstej listy | widok sesji |
| `--list-row-px` | komponentu (nowy) | 12 px | R01.1, T9 | poziomy padding wiersza gęstej listy | – |
| `--message-group-gap` | komponentu (nowy) | 12 px | R02.1, R02.3, T9 | odstęp między grupami wiadomości różnych autorów | listy |
| `--message-gap` | komponentu (nowy) | 4 px | R02.3, T9 | odstęp między kolejnymi wiadomościami jednego autora | listy |

Skala odstępów to istniejąca skala Tailwind (`--spacing` 0.25rem): 4, 8, 12, 16, 24, 32, 48 px. Tokeny odstępów wskazują jej kroki według relacji: w grupie 8, między grupami 16, wewnątrz panelu 16, między sekcjami 32.

Celowo bez tokenów: cienie (listy i karty bez cienia, R01.3; `Card` używa `ring-1`, nie `shadow`) i czas animacji (wiadomości bez animacji, P8 – to zasada, nie wartość).

## Kontrast par kolorów

Progi: tekst 4,5 : 1, elementy interfejsu 3 : 1. Przezroczystość liczona jako mieszanie w sRGB, tak jak w przeglądarce. Wszystkie pary w tej tabeli przechodzą próg, poza dwiema świadomie przyjętymi wyjątkami (T5) i jedną parą pomocniczą opisaną pod tabelą.

| Para | Motyw | Kontrast | Próg | Wynik |
|---|---|---|---|---|
| foreground stone-950 / background stone-50 | jasny | 18,92 | 4,5 | ✓ |
| foreground stone-950 / card white | jasny | 19,75 | 4,5 | ✓ |
| foreground stone-950 / muted stone-100 | jasny | 18,11 | 4,5 | ✓ |
| muted-foreground stone-600 / background stone-50 | jasny | 7,32 | 4,5 | ✓ |
| muted-foreground stone-600 / card white | jasny | 7,64 | 4,5 | ✓ |
| muted-foreground stone-600 / muted stone-100 | jasny | 7,01 | 4,5 | ✓ |
| secondary-foreground stone-900 / secondary stone-100 | jasny | 16,04 | 4,5 | ✓ |
| primary-foreground white / primary teal-800 | jasny | 7,53 | 4,5 | ✓ |
| primary-foreground white / primary teal-800 /80 (hover) | jasny | 4,70 | 4,5 | ✓ |
| teal-800 jako tekst / white | jasny | 7,53 | 4,5 | ✓ |
| teal-800 jako tekst / stone-50 | jasny | 7,21 | 4,5 | ✓ |
| teal-800 jako tekst / stone-100 | jasny | 6,90 | 4,5 | ✓ |
| destructive red-800 / white | jasny | 8,37 | 4,5 | ✓ |
| destructive red-800 / stone-50 | jasny | 8,02 | 4,5 | ✓ |
| destructive red-800 / stone-100 | jasny | 7,68 | 4,5 | ✓ |
| destructive red-800 / destructive /10 na white | jasny | 6,94 | 4,5 | ✓ |
| destructive red-800 / destructive /20 na white (hover) | jasny | 5,68 | 4,5 | ✓ |
| destructive red-800 / destructive /10 na stone-50 | jasny | 6,66 | 4,5 | ✓ |
| destructive red-800 / destructive /20 na stone-50 | jasny | 5,46 | 4,5 | ✓ |
| white / destructive red-800 | jasny | 8,37 | 4,5 | ✓ |
| white / destructive red-800 /80 (hover) | jasny | 5,91 | 4,5 | ✓ |
| input stone-500 / card white | jasny | 4,81 | 3 | ✓ |
| input stone-500 / background stone-50 | jasny | 4,61 | 3 | ✓ |
| ring stone-900 /50 / white | jasny | 3,35 | 3 | ✓ |
| obrys błędu red-800 (`border-destructive`) / white | jasny | 8,37 | 3 | ✓ |
| border stone-200 / white (separator) | jasny | 1,26 | 3 | wyjątek T5 – dekoracja |
| foreground stone-50 / background stone-950 | ciemny | 18,92 | 4,5 | ✓ |
| foreground stone-50 / card stone-900 | ciemny | 16,76 | 4,5 | ✓ |
| foreground stone-50 / muted stone-800 | ciemny | 14,56 | 4,5 | ✓ |
| muted-foreground stone-400 / background stone-950 | ciemny | 7,63 | 4,5 | ✓ |
| muted-foreground stone-400 / card stone-900 | ciemny | 6,76 | 4,5 | ✓ |
| muted-foreground stone-400 / muted stone-800 | ciemny | 5,87 | 4,5 | ✓ |
| primary-foreground stone-950 / primary teal-400 | ciemny | 10,59 | 4,5 | ✓ |
| primary-foreground stone-950 / primary teal-400 /80 (hover) | ciemny | 6,96 | 4,5 | ✓ |
| teal-400 jako tekst / stone-950 | ciemny | 10,59 | 4,5 | ✓ |
| teal-400 jako tekst / stone-900 | ciemny | 9,38 | 4,5 | ✓ |
| teal-400 jako tekst / stone-800 | ciemny | 8,14 | 4,5 | ✓ |
| destructive red-300 / background stone-950 | ciemny | 10,28 | 4,5 | ✓ |
| destructive red-300 / card stone-900 | ciemny | 9,11 | 4,5 | ✓ |
| destructive red-300 / muted stone-800 | ciemny | 7,91 | 4,5 | ✓ |
| destructive red-300 / destructive /20 na stone-950 (przycisk) | ciemny | 7,12 | 4,5 | ✓ |
| destructive red-300 / destructive /20 na stone-900 (przycisk na card) | ciemny | 5,97 | 4,5 | ✓ |
| destructive red-300 / destructive /30 na stone-950 (hover) | ciemny | 5,47 | 4,5 | ✓ |
| destructive red-300 / destructive /30 na stone-900 (hover na card) | ciemny | 4,64 | 4,5 | ✓ |
| obrys błędu `border-destructive/50` / card stone-900 | ciemny | 3,23 | 3 | ✓ |
| input stone-500 / background stone-950 | ciemny | 4,11 | 3 | ✓ |
| input stone-500 / card stone-900 | ciemny | 3,64 | 3 | ✓ |
| ring stone-100 /50 / stone-950 | ciemny | 4,98 | 3 | ✓ |
| ring stone-100 /50 / stone-900 | ciemny | 4,88 | 3 | ✓ |
| border white 10% / stone-950 (separator) | ciemny | 1,25 | 3 | wyjątek T5 – dekoracja |

Pary poniżej progu po zmianie T6 (red-700 → red-800): żadna z par tekstu. Para pomocnicza: `aria-invalid:ring-destructive/20` (pierścień błędu z prymitywów shadcn) ma 1,47 : 1 względem white, ale stan błędu identyfikuje pełny obrys `border-destructive` (8,37 : 1), więc pierścień jest tylko dodatkiem.

Obecne wartości (przed zmianą), które nie przechodziły progu i które ta propozycja naprawia: muted-foreground / muted w jasnym 4,34; destructive / destructive /10 w jasnym 3,99; ring /50: 1,54 (jasny) i 1,87 (ciemny); input: 1,26 (jasny) i 1,47 (ciemny).

## Decyzje, które nie są tokenami

Zasady:

1. Akcent (`--primary`) tylko na jednym elemencie ekranu: głównej akcji lub jej statusie (P5, K3).
2. Odznaka (Badge) w wariancie `default` (`bg-primary`) nie służy do statusów; statusy w wariancie `secondary` lub `outline` (P5, P1, T10).
3. Linki w treści w kolorze `foreground` z podkreśleniem, nie w akcencie (P5, T11).
4. Gęstość zależy od rodzaju ekranu: listy i panele gęste, widok sesji z kolumną rozmowy jako głównym elementem (K1).
5. Ze Slacka nie bierzemy koloru (K2); wzorzec czatu tylko w widoku sesji (K4).
6. Monospace tylko dla kodu, ścieżek, nazw plików i wersji (R01.2, P2).
7. Wiersze rozdziela linia 1 px; bez zagnieżdżonych ramek i bez cieni na listach (R01.3, P3).
8. Zaokrąglenie nie większe niż `xl`; pełne koło tylko dla awatarów (P13).
9. Bez gradientów, `backdrop-blur`, poświaty, iskierek, emoji w interfejsie, gwiazdek ocen, pasków postępu, planów subskrypcji i liczników hype (A01–A05, P11).
10. Bez dźwięków i bez liczników powiadomień; jeden wskaźnik zdarzeń rezerwacji (P10, D15).
11. Wiadomość pojawia się od razu, bez animacji wejścia (R02.2, P8).
12. Separatory `--border` mogą mieć kontrast poniżej 3 : 1, bo są dekoracją; wszystko, co identyfikuje kontrolkę (pole, fokus, błąd), spełnia 3 : 1 (T5).

Cechy komponentów:

- Wiersz listy: tytuł `text-sm` (14 px) medium w `foreground`, jedna linia metadanych `text-xs` (12 px) w `muted-foreground`; padding `--list-row-py` / `--list-row-px` (R01.1, T12, T9).
- Grupa wiadomości w sesji: pogrubione imię autora, godzina `text-xs` w `muted-foreground`; bez statusu obecności, reakcji i liczników odpowiedzi (R02.3, P9).
- Pole pisania: przypięte na dole strumienia; Enter wysyła, Shift+Enter nowa linia (R02.1, R02.2).
- Panel kontekstu sesji: pytanie z rezerwacji, druga osoba z linkiem do publicznej pracy, pozostały czas (P12).
- Nawigacja ról: krótka lista stałych pozycji (P12).
- Rezerwacja: cena widoczna przed polem pytania (P5).

## Decyzje T1–T16

| # | Decyzja | Status |
|---|---|---|
| T1 | Ciepłe szarości to paleta Tailwind stone (odpowiednik `baseColor: stone`). | zatwierdził: Arkadiusz |
| T2 | `--muted-foreground` = stone-600 (jasny), stone-400 (ciemny). | zatwierdził: Arkadiusz |
| T3 | `--input` = stone-500 w obu motywach. | zatwierdził: Arkadiusz |
| T4 | `--ring` = stone-900 (jasny), stone-100 (ciemny); neutralny, nie akcent. | zatwierdził: Arkadiusz |
| T5 | Separatory `--border` (stone-200 / white 10%) poniżej 3 : 1 jako elementy dekoracyjne. | zatwierdził: Arkadiusz |
| T6 | `--destructive` w jasnym motywie = red-800 (zmienione z proponowanego red-700, żeby hover /20 też przechodził próg). | zatwierdził: Arkadiusz (ze zmianą) |
| T7 | `--radius` = 0.375rem (6 px). | zatwierdził: Arkadiusz |
| T8 | Tokeny odstępów: `--space-in-group` 8, `--space-between-groups` 16, `--space-panel` 16, `--space-section` 32 px. | zatwierdził: Arkadiusz |
| T9 | Tokeny komponentów: `--list-row-py` 8, `--list-row-px` 12, `--message-group-gap` 12, `--message-gap` 4 px. | zatwierdził: Arkadiusz |
| T10 | Badge `default` nie dla statusów. | zatwierdził: Arkadiusz |
| T11 | Linki w treści w `foreground` z podkreśleniem, nie w akcencie. | zatwierdził: Arkadiusz |
| T12 | Wiersz listy: tytuł `text-sm` (14 px) medium, metadane `text-xs` (12 px). | zatwierdził: Arkadiusz |
| T13 | `--background` = stone-50 (strona), `--card` = white (listy i panele). | zatwierdził: Arkadiusz |
| T14 | `--sidebar-*` mapowane na tokeny główne, w tym `--sidebar-primary` = `--primary` (usuwa hue 264 w `.dark`). | zatwierdził: Arkadiusz |
| T15 | Wartości ciemnego motywu jak w tabeli, choć sam tryb ciemny zostaje luką (brak przełącznika). | zatwierdził: Arkadiusz |
| T16 | `--chart-*` i `--font-sans` (Geist) bez zmian – stan obecny, nie decyzja. | zatwierdził: Arkadiusz |
| F1 | `--destructive` w ciemnym motywie = red-300 (2026-10-19, etap 1 design systemu): przy shadcn red-400 przycisk `destructive/20` na card miał 4,48 : 1, hover `/30` 3,72 : 1 – tych par nie liczyliśmy wcześniej. Teraz 5,97 i 4,64. | zatwierdził: Arkadiusz |
| Akcent | Opcja A: teal-800 (jasny), teal-400 (ciemny). | zatwierdził: Arkadiusz |
