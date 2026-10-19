# Raport: audyt generycznego wyglądu i UX – `lekcja-06/02-rekrutacja.html` (TalentHub)

Ćwiczenie 1 lekcji 6, 2026-10-19. Prompt: `lekcja-06/cwiczenie-1-gotowy-prompt.txt`, uruchomiony w nowej sesji agenta (świeży kontekst) z przeglądarką `agent-browser`.

**Jak sprawdzono.** Kod przeczytany w całości (1530 linii). Strona otwarta jako `file://` w agent-browser 0.39.0 przy 1440, 768 i 320 px. Przed pomiarem przewinięto stronę, żeby zadziałały animacje `.reveal` i liczniki. Kontrast liczony w przeglądarce ze stylów obliczonych (`getComputedStyle`, mieszanie przezroczystości z tłem). Rozmiary klikalnych elementów i długości linii mierzone z prostokątów DOM, fokus sprawdzany klawiszem Tab. Zachowanie bez JS sprawdzone na kopii pliku bez `<script>`. Plików repozytorium nie zmieniano.

**Czego nie dało się zmierzyć bezpośrednio.** Kontrast tekstu na gradiencie w CTA policzono z geometrii gradientu 135° i pozycji tekstu, bez próbkowania pikseli. Nakładka z kropek `rgba(255,255,255,.15)` nie jest wliczona i w punktach kropek obniża kontrast jeszcze bardziej. Treści natywnego komunikatu walidacji przeglądarki nie oceniano, bo zależy od przeglądarki i jej języka.

## 1. Najważniejsze znaleziska

| znak lub błąd | gdzie | co widać | dlaczego to problem | czym zastąpić | pewność |
|---|---|---|---|---|---|
| Indygo + cyjan jako kolor akcji i marki bez uzasadnienia | l.14–17 (`--primary #4f46e5`, `--secondary #06b6d4`): wszystkie `.btn-primary`, eyebrow, aktywna zakładka, logo | Domyślne Tailwind indigo-600 i cyan-500. Produkt nie ma marki, więc kolor niczego nie wyraża | generyczny wygląd | Jeden kolor akcji wybrany świadomie dla produktu (branża HR, ton marki), zapisany jako token i sprawdzony kontrastem | sprawdzone |
| Gradient w tekście nagłówka i liczb | `.gradient-text` l.186–191 → h1 l.885; `.stat-box strong` l.409–418 | „naprawdę Ci pasuje” i 4 liczby przechodzą z indygo w cyjan. Najgorszy punkt (cyjan) ma 2,43:1 na bieli i 2,17:1 na `#eef2ff` w górze hero | generyczny wygląd / dostępność (duży tekst < 3:1) | Jednolity kolor tekstu. Wyróżnienie, jeśli w ogóle, przez treść, nie przez gradient | sprawdzone |
| Gradienty w tłach, w tym tło pod białym tekstem | hero l.134 + poświata l.137–146; CTA l.724 (3 przystanki + kropki l.732–739); `.logo-icon` l.103; paski lejka l.653 | W CTA biały akapit (90% krycia) ma w najgorszym punkcie 4,32:1 przy 1440 i 3,81:1 przy 768. Przycisk „Jestem pracodawcą” (16 px) ma 3,66–4,63:1, jego ramka `rgba(255,255,255,.4)` 1,4–2,25:1 | generyczny wygląd / dostępność | Jednolite tło CTA w kolorze akcji (biały na `#4f46e5` = 6,29:1). Ramka przycisku nieprzezroczysta, ≥ 3:1 | sprawdzone obliczeniowo (geometria gradientu, bez kropek) |
| Szablonowe hero: pigułka z liczbą, wyróżnione słowo, pływające karty | l.884 (pigułka z pulsującą kropką), l.885, l.909–948 (animacja `float` l.313, l.322) | Przy 1440 karta „+2 345 nowych aplikacji dziś” zasłania nazwisko 4. kandydata, a karta „Zaproszenie na rozmowę!” zasłania tytuł karty „Najlepiej dopasowani kandydaci”. Pod 900 px całe `.hero-visual` znika | generyczny wygląd / UX | Hero zbudowane wokół wyszukiwarki i prawdziwych ofert, bez dekoracyjnych kart i ich nakładania się | sprawdzone (zrzut 1440) |
| Rząd wielkich liczb, animowane liczniki | l.968–975, skrypt l.1497–1510 | 4 liczby 44 px w gradiencie. Bez JS wszystkie pokazują „0”. Licznik daje „3500+” bez spacji, a w innych miejscach jest „3 500”. Przy 320 px druga kolumna wychodzi poza ekran | generyczny wygląd / UX / bez JS | Usunąć albo pokazać 1–2 liczby z podanym źródłem, statycznie w HTML, w jednej kolumnie na wąskim ekranie | sprawdzone |
| Kształt: pigułki i duże promienie wszędzie, rozmyty nagłówek, karta w karcie | `999px` w l.161, 241, 297, 562, 646, 652, 709; promienie 10–24 px na resztę; `backdrop-filter: blur(12px)` l.81–82; kafle KPI w karcie `.dashboard` l.1265–1272; karty z cieniem i uniesieniem na hover (l.458, 488–492, 529) | Prawie każda treść jest w zaokrąglonej karcie. Kroki, kategorie, oferty, opinie i plany mają ten sam „kartowy” schemat | generyczny wygląd | Jedna skala 2–3 promieni. Pigułka tylko dla tagów filtrów. Sekcje oddzielone typografią i odstępem, karta tylko tam, gdzie jest obiekt (oferta) | sprawdzone |
| Ozdobniki: logo-kwadrat z ikoną, awatary z inicjałami, „logotypy” z liter | l.858–860, l.1396–1398; awatary l.916–931, 1300–1316; logo firm l.1111, 1132, 1153, 1174, 1195, 1215 | Logo to gradientowy kwadrat z ikoną „users” z Feathera. Kontrast białych inicjałów: ZW/JW 2,15, MN/TZ 2,43, PL 3,53, AK/KM 4,47; litery firm BK 3,13, SL 3,30 (15–18 px, to nie jest duży tekst) | generyczny wygląd / dostępność | Prawdziwe logo i zdjęcia albo neutralny placeholder z tekstem o kontraście ≥ 4,5:1 | sprawdzone |
| Zmyślone dane i niespójne liczby | komentarz l.2 przyznaje, że „liczby, opinie i lista firm są zmyślone”; lejek l.1275–1280; kategorie l.1042–1091; opinie l.1296–1319 | Szerokości pasków lejka nie zgadzają się z liczbami: 412/1284 = 32%, a pasek ma 62%; 158 → 12% vs 34%; 96 → 7,5% vs 20%; 31 → 2,4% vs 9%; 23 → 1,8% vs 6%. Suma ofert w kategoriach to 11 315 przy „Ponad 12 000 aktywnych ofert”. Wszystkie opinie 5/5. „TechNova” i „Wieża Kodu” nie występują na liście „zaufało nam 3 500 firm” | generyczny wygląd / wiarygodność | Tylko dane z produktu, ze źródłem i datą. Bez danych nie ma sekcji | sprawdzone (arytmetyka); fikcyjność potwierdza komentarz w pliku |
| Pozostałe kontrasty poniżej progu | `.match` l.291–298; `.kpi em` l.638; `.stars` l.672; `.logo-row span` l.361–367; `.chip.green` l.570; `.footer-bottom` l.786; newsletter l.766–777; ramki `--border` | % dopasowania `#10b981`/`#ecfdf5` 2,41:1; „+18%” 2,43:1; gwiazdki 2,15:1; nazwy firm `#9ca3af` (22 px bold, próg 3:1) 2,54:1; chip „UoP” 3,58:1; © w stopce 3,75:1; placeholder e-maila `#757575`/`#1e293b` 3,17:1; ramki pól i kart `#e5e7eb` na bieli 1,24:1. Wyniki takie same przy 1440, 768 i 320 | dostępność | Tokeny kolorów tekstu i stanów sprawdzone parami (tekst ≥ 4,5:1, granica pola ≥ 3:1) | sprawdzone |
| Pola formularza tylko z placeholderem | wyszukiwarka l.891, l.895; newsletter l.1434 | Brak `<label>` i `aria-label`. Placeholder jest ucięty („Stanowisko, firma lub umi…”) przy 1440 i 320 | UX / dostępność | Widoczne etykiety nad polami. Placeholder najwyżej jako przykład | sprawdzone |
| Niewidoczny fokus, elementy poza klawiaturą | `.search-field input { outline: none }` l.222; `.newsletter input:focus` l.777; tagi `<span class="tag">` l.902–905; `.category` z `cursor:pointer` l.486 | Po Tab pola wyszukiwania mają `outline-style: none` i żadnego zamiennika. Fokus newslettera to tylko zmiana ramki, `#4f46e5` na `#1e293b` = 2,33:1. Tagi „Popularne” działają tylko myszą. Karty kategorii wyglądają na klikalne, ale nic nie robią. Reszta ma domyślny obrys przeglądarki | dostępność / UX | Wspólny styl `:focus-visible` (≥ 2 px, ≥ 3:1). Tagi jako `<button>`, kategorie jako linki do listy ofert | sprawdzone |
| Treść znika bez JavaScriptu, ruch bez `prefers-reduced-motion` | `.reveal { opacity: 0 }` l.804; skrypt l.1513–1526; animacje l.173, 313, 322 | Bez JS 30 elementów ma krycie 0: statystyki, kroki, kategorie, oferty, sekcja dla pracodawców, opinie, cennik i CTA. Nie działa też menu mobilne ani zakładki. Animacje są nieskończone, a reguły `prefers-reduced-motion` nie ma | UX / dostępność | Treść widoczna domyślnie, animacja jako dodatek (klasa dodawana przez JS) oraz `@media (prefers-reduced-motion: reduce)` | sprawdzone (kopia bez skryptu) |
| Układ przy 320 px i nawigacja mobilna | `.stats-grid` l.833; `.pricing`/`.plan` l.679–693; l.817, l.847 | Przy 320 px strona przewija się w poziomie (`scrollWidth` = 494 px): wystają liczby 44 px w 2 kolumnach i karty cennika szerokie na 361 px. „Zaloguj się” znika od 900 px w dół, „Dodaj ogłoszenie” od 600 px w dół. Żadnego z nich nie ma w menu. Przycisk menu nie ma `aria-expanded` | UX / dostępność | 1 kolumna i mniejszy font liczb pod 600 px, `min-width: 0` w siatce cennika, logowanie i dodawanie ogłoszenia w menu mobilnym, `aria-expanded`/`aria-controls` | sprawdzone (zrzut 320) |
| Brak stanów; kolor jedynym nośnikiem stanu | wyszukiwarka l.1477–1480; newsletter l.1483–1489; zakładki l.986–989, 443; zakładka „zapisz” l.1116 i kolejne, 557–558 | „Szukaj ofert” niczego nie szuka, tylko przewija do 6 stałych ofert. Akceptuje pusty formularz i nie ma stanu ładowania, braku wyników ani błędu. Newsletter pokazuje „Dzięki!” na 2,5 s, bez ładowania i bez obsługi błędu; walidacja jest tylko natywna. Aktywną zakładkę oznacza tylko kolor tła (brak `role="tab"` i `aria-selected`). „Zapisz” zmienia kolor i wypełnienie, ale bez `aria-pressed`. 6 przycisków ma identyczny `aria-label="Zapisz ofertę"` | UX / dostępność | Komponenty z pełnym zestawem stanów (domyślny, ładowanie, pusto, błąd z instrukcją, sukces). Stan wyrażony tekstem lub ikoną i atrybutem ARIA. Unikalne etykiety typu „Zapisz ofertę: Senior Frontend Developer” | sprawdzone |
| Linie tekstu dłuższe niż 75 znaków | przy **768 px**: `.step p` l.995–1005, `.feature p` l.1248–1260, lead pracodawców l.1244, `.testimonial blockquote` l.1298–1314, `footer p` l.1401 | 11 akapitów ma 78–85 znaków w linii (kontener 587–720 px przy 1 kolumnie). Przy 1440 i 320 px nie ma linii powyżej 75 znaków | UX (czytelność) | `max-width` dla tekstu ok. 60–70 ch | sprawdzone |

## 2. Pozostałe znaleziska

**Status znaków z kroku 1:**
- **Kolor:**
  - indygo jako kolor akcji: występuje
  - gradient w tekście nagłówka: występuje
  - gradient w tle albo na przycisku: występuje w tłach (na przyciskach nie)
  - ciemnogranatowe tło z poświatą: nie występuje w tej formie. Odpowiedniki: cyjanowa poświata na jasnym hero (l.137–146) i granatowa stopka `#0f172a` bez poświaty.
- **Kształt i głębia:**
  - duże zaokrąglenia i pigułki: występuje
  - karty z cieniem jako jedyny sposób oddzielenia treści: nie występuje dosłownie, bo karty mają też ramkę 1 px. Prawie cała treść jest jednak zamknięta w kartach.
  - karta w karcie: występuje (KPI w `.dashboard`, karty nachodzące na kartę w hero)
  - półprzezroczyste, rozmyte panele: występuje (nagłówek)
- **Układ:**
  - pigułka nad nagłówkiem: występuje
  - wyróżnione kolorem słowo: występuje (h1 oraz „Hub” w logo, l.108)
  - para przycisków: występuje („Utwórz darmowe konto” + „Jestem pracodawcą” l.1383–1384; „Zaloguj się” + „Dodaj ogłoszenie” l.871–872)
  - rząd wielkich liczb: występuje
  - trzy identyczne karty z ikoną: występuje (3 kroki z numerem na kolorowym kafelku ×2 zakładki, 3 opinie, 3 plany, 8 kart kategorii)
  - karty unoszące się nad pierwszym ekranem: występuje
- **Ozdobniki:**
  - logo jako kolorowy kwadrat z ikoną: występuje
  - awatary z inicjałami: występuje
  - emoji zamiast ikon: nie występuje (ikony SVG Feather; ★ i → to znaki Unicode, nie emoji)
  - iskierki jako symbol AI: nie występuje. Możliwy odpowiednik: błyskawica przy „Dopasowanie oparte na AI” (l.1247), to przypuszczenie.
  - ikony na kolorowym tle przy nagłówkach: występuje (`.category-icon`, `.feature-icon`, `.step-num`, `.stat-icon`)
- **Tekst i dane:**
  - puste obietnice: występuje („naprawdę Ci pasuje”, „Rekrutuj mądrzej, nie ciężej”, „Prosty proces, szybkie efekty”, „szybciej niż kiedykolwiek”, „Koniec z czekaniem bez odpowiedzi”)
  - liczby niespójne lub zmyślone: występuje (wiersz 8 tabeli)

**Pozostałe znaleziska:**
- Nazwa marki rozpada się na „Talent Hub”, bo `gap: 10px` w `.logo` (l.94) działa też między węzłem tekstowym a `<span>` (sprawdzone na zrzucie).
- Hierarchia nagłówków: w hero po h1 jest h4 (l.912), w stopce h5 bez h3/h4, w sekcji „Dla pracodawców” h4 pod h2.
- Gwiazdki „★★★★★” nie mają tekstowego odpowiednika oceny, więc czytnik ekranu odczyta pięć znaków.
- 25 martwych linków `href="#"`.
- Okienko „przeglądarki” z trzema kropkami w stylu macOS nad dashboardem (l.1266) to czysta dekoracja.
- Plakietka „Najpopularniejszy” (l.1346) nie ma pokrycia w danych.
- Inter z Google Fonts to krój domyślny dla takich szablonów. Nie ma uzasadnienia w marce, której brak.
- Style inline powielają reguły i tokeny: h2 l.1243 kopiuje `.section-head h2`; `#4f46e5`, `#eef2ff` i `#111827` są wpisane na sztywno obok tokenów `--primary`, `--primary-light` i `--text`.
- `transition: all` na przyciskach i kartach oraz uniesienie `translateY` na hover kart, które nie są klikalne (`.step`).
- Rozmiar klikalnych elementów:
  - wszystkie przyciski, pola, ikony społecznościowe (38 px) i zakładki „zapisz” (36 px) mają co najmniej 24 × 24 px przy 1440, 768 i 320 px;
  - mniejsze są tylko linki tekstowe w nawigacji i stopce (wysokość 19 px), ale spełniają wyjątek odstępu WCAG 2.5.8 (zmierzone);
  - tagi „Popularne” mają ok. 31 px wysokości, ale nie da się ich obsłużyć klawiaturą.
- Kontrasty w normie: placeholder wyszukiwarki `#757575` na bieli ok. 4,6:1; tekst `#6b7280` na bieli 4,83:1; chipy niebieski 4,75:1 i fioletowy 5,2:1; stopka `#94a3b8` 6,96:1.
- Kontener zakładek przy 320 px wystaje o 1 px (321 px), co jest pomijalne.

## 3. Liczby z kroku 3

- **Kolory tekstu widoczne przy 1440 px: 13**, czyli 12 jednolitych i 1 gradient tekstu:
  - `#111827`, `#6b7280`, `#ffffff`, `#4f46e5`, `#94a3b8`, `#10b981`, `#9ca3af`, `#2563eb`, `#059669`, `#7c3aed`, `#f59e0b`, `#64748b`
  - gradient `#4f46e5`→`#06b6d4`
  - Liczone na całej stronie po przewinięciu (ukryta zakładka „Dla pracodawców” i stany hover pominięte). Biały akapit w CTA z kryciem 90% policzony jako biały.
- **Rozmiary fontu widoczne przy 1440 px: 13**: 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 40, 44 i 56 px.
- **Promienie zaokrąglenia w kodzie: 8 unikalnych wartości**: 8, 10, 12 (również przez `--radius`), 16, 20 i 24 px, 50% oraz 999 px. Do tego `rx` 2 i 5 w ikonach SVG.
- **Odstępy (padding, margin, gap) w kodzie: 24 unikalne wartości niezerowe** (poza 0 i `auto`): 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96 i 120 px.
  - **Poza siatką 4 px: 7 wartości** (2, 3, 5, 6, 10, 14, 18 px) w 26 deklaracjach.
  - Przesunięć pozycjonowania (`top`/`left` itp.) i `letter-spacing` nie liczono.
- **Kolory wpisane na sztywno poza plikiem tokenów** (blok `:root`, l.13–27): **50 unikalnych literałów**, w tym 42 hex i 8 rgba, w CSS i atrybutach `style`.
  - Część dubluje istniejące tokeny (`#4f46e5`, `#eef2ff`, `#111827`, `#fff`).
  - Klas Tailwinda nie ma.
  - Sam blok tokenów ma 13 kolorów, prawie wszystkie to wartości domyślne palety Tailwinda.

## 4. Pięć decyzji, żeby interfejs przestał wyglądać jak średnia

1. **Kolor akcji i paleta stanów** (token). Jeden kolor akcji wynikający z marki lub kontekstu produktu, zamiast domyślnego indygo z cyjanem. Do tego zamknięty zestaw tokenów tekstu, tła, ramki i stanów (sukces, błąd, ostrzeżenie), każda para sprawdzona kontrastem. Bez gradientów w tekście i pod tekstem. Zastępuje 50 literałów i 13 kolorów tekstu.
2. **Skala typografii** (token). 5–6 stopni zamiast 13 rozmiarów, maksymalna długość linii ok. 65 ch i krój wybrany pod produkt, a nie domyślny.
3. **Skala promieni i odstępów oraz zasada separacji treści** (token + zasada). 2–3 promienie i odstępy na siatce 4/8 px. Pigułka tylko dla tagów i filtrów. Sekcje oddziela odstęp i typografia, a karta oznacza wyłącznie obiekt, na którym się działa (oferta pracy), bez kart w kartach, unoszenia i rozmycia.
4. **Wyszukiwarka i karta oferty jako właściwe komponenty** (komponent). Pole z widoczną etykietą, widocznym fokusem i pełnymi stanami (ładowanie, brak wyników, błąd z instrukcją). Karta oferty z linkiem do szczegółów i przyciskiem „zapisz” z `aria-pressed` i unikalną nazwą. To one, a nie dekoracyjne karty, budują pierwszy ekran.
5. **Prawdziwe dane i stopniowe ulepszanie** (zasada). Na stronie są tylko liczby, opinie i logotypy z rzeczywistych danych, ze źródłem. Jeśli danych nie ma, sekcja nie powstaje. Treść jest widoczna bez JS, animacje są opcjonalne i wyłączane przez `prefers-reduced-motion`.
