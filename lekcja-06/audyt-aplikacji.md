# Audyt interfejsu DevMentor: generyczny wygląd i błędy UX

Lekcja 6, ćwiczenie 1 na naszej aplikacji, 2026-10-19 (stan po partiach 1–3 etapu 2 design systemu). Prompt `lekcja-06/cwiczenie-1-gotowy-prompt.txt` z blokiem „Co sprawdzasz” podmienionym na: `packages/app/src/app` i `packages/ui/src`; `http://localhost:3000`, `/admin`, `/admin/users`; tokeny `packages/ui/src/styles/`; brief, `referencje.md` i `tokeny.md`. Świeża sesja agenta z `agent-browser` 0.39.0 przy 1440, 768 i 320 px, tylko odczyt.

**Ograniczenia:**
- Tabela użytkowników była pusta (`total: 0`), więc wiersze, akcje i paginację oceniono tylko z kodu.
- Formularza „New user” nie wysłano, więc błędów pól nie widziano na ekranie.
- W trakcie audytu inny agent zmieniał prymitywy w `packages/ui/src/components/ui` (partia 4).
- Zrzuty i pomiary są tylko w scratchpadzie sesji.

**Uwaga właściciela do wiersza o kroju:** Geist i Geist Mono zostały przyjęte jako decyzja w etapie 0 (P2). Uwagę „to tylko stan obecny, T16” traktujemy jako nieaktualną.

## Krok 1. Znaki generycznego wyglądu

**Kolor:**
- **indygo lub fiolet:** nie występuje; odpowiednik: akcja strony głównej w cyan-400 (`page.tsx:17`), spoza marki (akcent to teal-800).
- **gradienty:** nie występują.
- **ciemnogranatowe tło:** występuje częściowo. `page.tsx:3` `bg-slate-950`, bez poświaty. Panel ma ciepłe stone-50, więc strona główna i aplikacja wyglądają jak dwa produkty.

**Kształt i głębia:**
- **pigułki i duże zaokrąglenia:** nie występują (wyjątek: `rounded-xl` linku karty w `admin/page.tsx:64`);
- **karta z cieniem, karta w karcie, rozmycie:** nie występują.

**Układ:**
- **etykieta nad nagłówkiem:** występuje jako odpowiednik („DEVMENTOR” wersalikami nad H1, `page.tsx:5`);
- **siatka identycznych kart:** występuje jako odpowiednik bez ikon: 4 karty w `/admin`, 3 z nich „Coming soon”;
- strona główna jako całość to typowy szablon hero (wyśrodkowany H1 60 px, lead, jeden przycisk).

**Ozdobniki:** brak (bez logo-kwadratu, emoji i iskierek; Avatar nieużywany).

**Tekst i dane:**
- **puste obietnice:** występują. „Grow with a mentor who knows the way… next step in your tech career” (`page.tsx:9,12-13`) jest sprzeczne z briefem i A02 i powtarza pozycjonowanie ADPList.
- **zmyślone dane:** brak liczb i opinii; są wymyślone placeholdery „Ada Lovelace”, „ada@example.com” (`users-admin.tsx:17-18`).
- **spoza briefu:** „verification” w `admin/page.tsx:20`.

## Krok 2. Błędy UX i dostępności

- **Kontrast:** jedyna para poniżej progu to opisy „Coming soon” na `/admin`: **2,88 : 1** (`opacity-60`). Reszta tekstów od 5,23 do 20,16 : 1.
- **Cele:** „← Admin panel” ma 98,5 × 18 px. Spełnia wyjątek odstępu WCAG 2.5.8, ale na dotyku zostaje 18 px przy kontrolkach 40 px.
- **Etykiety pól i stany:** bez problemów. Name, Email i Role mają `<label>`; DataTable ma stany ładowanie, pusto i błąd.
- **Fokus:** widoczny, ale niespójny. Przyciski mają pierścień z design systemu, linki obrys przeglądarki, a CTA strony głównej własny cyan-300.
- **Linie i responsywność:** linie ≤ 66 znaków; przy 320 px brak przewijania w bok.
- **Bez JavaScriptu:** `/admin/users` pokazuje „Loading…” bez końca, „New user” jest martwy, `/admin` stoi na „Database: checking…”.

## 1. Najważniejsze znaleziska

| Znak lub błąd | Gdzie | Co widać | Dlaczego to problem | Czym zastąpić | Pewność |
|---|---|---|---|---|---|
| Strona główna poza design systemem | `page.tsx:3,5,11,17` | slate-950, cyan-400/300, slate-300, white na sztywno | generyczny wygląd; dwa wyglądy w jednym produkcie | `bg-background`, `text-foreground`, `text-muted-foreground`, `Button` (teal) | sprawdzone |
| Pusta obietnica w hero | `page.tsx:9,12-13` | „Grow with a mentor… next step in your tech career” | sprzeczne z briefem i A02 | opis z briefu: tekstowa sesja 25/50 min o jednym problemie, płatność z góry, cena przed pytaniem | sprawdzone |
| Szablon hero | `page.tsx:5,8` | etykieta „DEVMENTOR” + wyśrodkowany H1 60 px | generyczny wygląd (A01) | nazwa jako znak słowny w nagłówku, `type-page-title`, układ do lewej | sprawdzone |
| Martwy CTA | `page.tsx:16` | `href="#mentors"` bez celu | jedyna akcja nic nie robi | link do listy mentorów albo brak akcji, dopóki listy nie ma | sprawdzone |
| Siatka kart, 3 z 4 martwe | `admin/page.tsx:18-23, 53-71` | 4 karty, 3 „Coming soon” | siatka kart (A01); szum | krótka nawigacja ról (R02.6/P12) tylko z istniejącymi pozycjami | sprawdzone |
| Kontrast „Coming soon” | `admin/page.tsx:56` | 2,88 : 1 | WCAG 1.4.3 | bez opacity; `muted-foreground` (7,64 : 1) | sprawdzone |
| Niespójny fokus linków | karta „Users”, „← Admin panel”, CTA | obrys przeglądarki / cyan | trzy różne wskaźniki fokusu | jeden styl `focus-visible:ring-3 ring-ring/50`, `rounded-lg` | sprawdzone |
| Treść zależna od JS | `/admin/users`, `/admin` | „Loading…” bez końca, „checking…” | pusty ekran przy błędzie skryptu | pierwsza strona danych z serwera | sprawdzone |
| Mały link powrotu | `admin/users/page.tsx:13` | 18 px wysokości | dotyk przy kontrolkach 40 px | `h-control-sm` albo padding ≥ 24 px | sprawdzone |
| Tabela niezgodna z T9/T12 | `table.tsx:72,85`, `DataTable.tsx` | `h-10 px-2`, `p-2` z shadcn | domyślna tabela, nie gęsta lista | tokeny wiersza listy, `type-label` / `type-meta` | przypuszczenie (baza pusta) |
| Wymyślone placeholdery | `users-admin.tsx:17-18` | „Ada Lovelace”, „ada@example.com” | dane spoza produktu, mylone z wartością | bez placeholdera, format w podpowiedzi | sprawdzone |
| Nieaktualny stan pusty | `users-admin.tsx:116` | „…with the button above” przy ukrytym przycisku | wskazuje nieistniejący element | tekst niezależny od położenia | sprawdzone |

## 2. Pozostałe znaleziska

- Karta-link „Users” nie wygląda na klikalną.
- `/admin` nie ma jednego wyróżnionego elementu w kolorze akcentu (P5).
- `ErrorMessage` pokazuje surowy `error.message` z API.
- Widok admina bez danych ma dużo pustego miejsca.
- Ciemnego motywu nie da się sprawdzić w aplikacji, bo nie ma przełącznika (T15).

## 3. Liczby

- **Kolory tekstu przy 1440 px:** 7 zadeklarowanych, 9 widocznych. Strona główna: cyan-400, white, slate-300, slate-950; panel: stone-950, stone-600, stone-900, white, plus 2 odcienie przez `opacity-60`.
- **Rozmiary fontu:** 6 (12, 14, 16, 18, 24, 60 px).
- **Promienie:** 6 wartości (0; 3,6; 4,8; 6; 8,4 px; koło). Poza skalą jest tylko `rounded-xl` w `admin/page.tsx:64`.
- **Odstępy:** 13 wartości. Poza siatką 4 px są 4 wartości (1, 2, 6, 10 px) w 17 użyciach (`*-0.5`, `*-1.5`, `*-2.5`, `px-px`).
- **Kolory na sztywno poza tokenami:** 8, wszystkie w `packages/app/src/app/page.tsx`. W `packages/ui/src`: 0.

## 4. Pięć decyzji

1. **Wszystkie strony, także marketingowe, tylko przez tokeny** (zasada + ESLint/`lint:tokens` obejmujący `packages/app`).
2. **Treść strony głównej z briefu, nie z szablonu hero** (zasada treści, bez słownictwa A02).
3. **Nawigacja ról jako krótka lista, nie siatka kart** (komponent, R02.6/P12).
4. **DataTable jako gęsta lista według T9/T12** (komponent).
5. **Jeden styl fokusu dla każdego elementu interaktywnego**, także linków i kart-linków (zasada). Krój Geist jest już decyzją (P2).
