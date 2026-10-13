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

**Język interfejsu: angielski** – zgodnie z makietami DevMentora z kursu. Dokumentacja projektu (README) jest po polsku.

## Stack technologiczny

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL 17** + **MikroORM 7** (encje, migracje, pula połączeń)
- **Awilix** – kontener Dependency Injection
- **Tailwind CSS 4** na stronach publicznych, **shadcn/ui** w panelu admina
- **Monorepo** – npm workspaces, pakiety `app`, `core`, `db`, `ui` w folderze `packages/`
- **ESLint**, **GitHub Actions** (CI), **Docker**

## Architektura

Monorepo z czterema pakietami i wymuszonym kierunkiem zależności **`app → core → db`** (z `ui` korzysta tylko `app`). Pilnuje tego ESLint – import „pod prąd” kończy się błędem.

```
packages/
  app/    @devmentor/app   Next.js: strony i endpointy API (src/app)
  core/   @devmentor/core  logika biznesowa: kontener Awilix, serwisy
  db/     @devmentor/db    MikroORM: encje, migracje (jedyny pakiet z dostępem do @mikro-orm)
  ui/     @devmentor/ui    komponenty shadcn/ui
.ai/                       specyfikacje, logi przebiegów AI, wnioski, dokumentacja (docs/)
```

- **Koncepty domenowe zamiast modułów:** każdy koncept (`auth`, `mentors`, `bookings`, …) to podfolder o tej samej nazwie w każdej warstwie, np. `db/src/entities/auth/user.entity.ts` i `core/src/services/auth/user.service.ts`.
- **Przepływ żądania:** endpoint albo strona (`app`) → `createRequestScope()` (`core`, Awilix) → serwis (`core`) → `EntityManager` (`db`, MikroORM) → PostgreSQL. Każde żądanie dostaje własny fork `EntityManager`.
- **Baza:** encje przez `defineEntity`, tabele w liczbie mnogiej (`users`), migracje generuje MikroORM, a CI pilnuje ich zgodności z encjami.
- **Wspólna warstwa API i UI:** endpointy budujemy przez `apiHandler`/`makeCrudRoute` (jednolite odpowiedzi `{ ok, data }` / `{ ok, error }`, walidacja Zod, obsługa błędów), a ekrany przez `apiCall`, `CrudForm` i `DataTable`. Wzorcowy przykład: `/api/users` i `/admin/users`.
- **Konfiguracja:** jeden plik `.env` w katalogu głównym repozytorium.
- **Zasady inżynierskie:** [`.ai/docs/engineering-standards.md`](.ai/docs/engineering-standards.md) (standardy z kursu, lekcja 2). Zasady dla agentów AI: [`AGENTS.md`](AGENTS.md) oraz `AGENTS.md` w każdym pakiecie.

## Narzędzia

- **Agenty kodujące:** Claude Code i Codex
- **Skille AI:** [`open-mercato/skills`](https://github.com/open-mercato/skills) (zainstalowane globalnie dla obu agentów)
- **GitHub:** kod, zadania (issues), Pull Requesty i CI w jednym miejscu; obsługa z terminala przez GitHub CLI (`gh`)
- **Edytor:** Visual Studio Code
- **Środowisko:** lokalnie na macOS (Node.js 22), PostgreSQL i obraz aplikacji w Dockerze (Docker Desktop)

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
- Do projektu weszła wersja Codexa – lepiej wygląda jako ekran startowy i ma obsłużoną dostępność przycisku. Teksty zostały potem przetłumaczone na angielski.

## Uruchomienie lokalne

Wszystkie polecenia uruchamiasz z katalogu głównego repozytorium.

```bash
npm install
cp .env.example .env
docker compose up -d db     # PostgreSQL w Dockerze
npm run db:migrate          # tworzy tabele
npm run dev
```

- aplikacja: [http://localhost:3000](http://localhost:3000)
- panel admina: [http://localhost:3000/admin](http://localhost:3000/admin) (zarządzanie użytkownikami: `/admin/users` – działa tylko w trybie deweloperskim, dopóki nie ma logowania)
- połączenie z bazą: [http://localhost:3000/api/health](http://localhost:3000/api/health) – `{"status":"ok","database":"ok"}` oznacza, że aplikacja widzi bazę (gdy baza nie działa, endpoint zwraca HTTP 503)

Baza jest dostępna pod `localhost:5432`, a adres połączenia jest w zmiennej `DATABASE_URL` w pliku `.env`.

### Migracje bazy

```bash
npm run db:migration:create   # po zmianie encji – generuje nową migrację
npm run db:migrate            # wykonuje oczekujące migracje
npm run db:migration:check    # sprawdza, czy encje i migracje są zgodne
```

## Uruchomienie w Dockerze

Wymaga zainstalowanego [Docker Desktop](https://www.docker.com/products/docker-desktop/).

Aplikacja i baza danych razem:

```bash
docker compose up --build
npm run db:migrate          # przy pierwszym uruchomieniu – tworzy tabele (z hosta, przez localhost:5432)
```

- aplikacja: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `localhost:5432` (domyślnie użytkownik, hasło i baza: `devmentor`, można je zmienić w `.env`)

Zatrzymanie: `docker compose down`. Dane bazy zostają w wolumenie `db-data`; żeby je usunąć, użyj `docker compose down -v`.

Sam obraz aplikacji, bez bazy:

```bash
docker build -t devmentor .
docker run -p 3000:3000 devmentor
```

Na co dzień do pracy nad kodem używaj `npm run dev` – na macOS działa szybciej niż aplikacja w kontenerze. Docker służy do uruchamiania bazy i do wdrożeń.
