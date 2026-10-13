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

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja działa pod adresem [http://localhost:3000](http://localhost:3000).
