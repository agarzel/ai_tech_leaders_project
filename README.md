# DevMentor – marketplace mentoringowy dla programistów

Projekt realizowany w ramach kursu **AI Tech Leaders**. Budujemy go razem z kursem, krok po kroku, technikami AI Engineeringu.

## O projekcie

DevMentor to aplikacja webowa typu marketplace (w stylu Preply czy Booksy), która łączy doświadczonych developerów, chcących dzielić się wiedzą, z osobami szukającymi mentora.

Planowany zakres:

- role: mentor, uczeń (mentee), administrator,
- rejestracja, logowanie i autoryzacja,
- profile mentorów i wyszukiwarka,
- umawianie sesji (kalendarz, dostępność),
- wiadomości między użytkownikami,
- płatności i obsługa sporów,
- responsywny interfejs, przyjazny na urządzeniach mobilnych.

Aplikację budujemy jak framework: reużywalne komponenty i endpointy, bez duplikacji.

## Stack technologiczny

- **Next.js** (App Router) + **React**
- **TypeScript**
- **PostgreSQL**
- **ESLint**

## Narzędzia

- **Agenty kodujące:** Claude Code i Codex
- **Skille AI:** [`open-mercato/skills`](https://github.com/open-mercato/skills) (zainstalowane globalnie dla obu agentów)
- **GitHub:** kod, zadania (issues), Pull Requesty i CI w jednym miejscu; obsługa z terminala przez GitHub CLI (`gh`)
- **Edytor:** Visual Studio Code
- **Środowisko:** lokalnie na macOS (Node.js 22)

## Porównanie agentów (zadanie domowe, lekcja 1)

Obu agentom zleciłem to samo zadanie:

> Na stronie głównej (`app/page.tsx`) zamień domyślną treść na prosty ekran powitalny DevMentor: nagłówek, jedno zdanie opisu i przycisk „Znajdź mentora”. Użyj Tailwinda.

| | Codex | Claude Code |
|---|---|---|
| Nagłówek | Hasło marketingowe, „DevMentor” jako mała etykieta nad nim | „DevMentor” jako główny nagłówek |
| Wygląd | Własny ciemny motyw (granat + turkus) | Kolory i jasny/ciemny tryb z istniejącego szablonu |
| Przycisk | Link `#mentorzy`, wyraźne obramowanie przy nawigacji klawiaturą | `Link` z Next.js do `/mentorzy` (podstrona jeszcze nie istnieje) |
| Przygotowanie | – | Przeczytał `AGENTS.md`, sprawdził wersje bibliotek i `layout.tsx` |
| Zakres zmian | Tylko `app/page.tsx` | Tylko `app/page.tsx` |
| Lint i typy | ✅ | ✅ |

**Wnioski:**

- Oba agenty wykonały zadanie poprawnie i nie ruszyły innych plików.
- Codex zinterpretował prompt bardziej kreatywnie (własny styl, hasło), Claude Code trzymał się dosłownej treści i konwencji projektu.
- Im mniej szczegółów w prompcie, tym więcej decyzji agent podejmuje sam – wygląd, teksty, cel przycisku. W kolejnych zadaniach warto to doprecyzowywać w specyfikacji.
- Do projektu weszła wersja Codexa – lepiej wygląda jako ekran startowy i ma obsłużoną dostępność przycisku.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja działa pod adresem [http://localhost:3000](http://localhost:3000).
