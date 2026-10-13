# DevMentor – a mentoring marketplace for developers

Built during the **AI Tech Leaders** course. We develop it step by step alongside the course, using AI engineering techniques.

## About the project

DevMentor is a marketplace web app (in the spirit of Preply or Booksy) that connects experienced developers who want to share their knowledge with people looking for a mentor.

Planned scope:

- roles: mentor, mentee, administrator,
- registration, login and authorization,
- mentor profiles and search,
- session booking (calendar, availability),
- messaging between users,
- payments and dispute handling,
- a responsive, mobile-friendly interface.

We build the app like a framework: reusable components and endpoints, no duplication.

**Language: English** – both the user interface (matching the course's DevMentor mockups) and the project documentation.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL 17** + **MikroORM 7** (entities, migrations, connection pooling)
- **Awilix** – dependency injection container
- **Tailwind CSS 4** on public pages, **shadcn/ui** in the admin panel
- **Monorepo** – npm workspaces, packages `app`, `core`, `db`, `ui` in `packages/`
- **ESLint**, **Vitest**, **GitHub Actions** (CI), **Docker**

## Architecture

A monorepo with four packages and an enforced dependency direction **`app → core → db`** (`ui` is used by `app` only). ESLint guards it – an import "against the flow" fails the build.

```
packages/
  app/    @devmentor/app   Next.js: pages and API endpoints (src/app)
  core/   @devmentor/core  business logic: Awilix container, services, HTTP layer, validators
  db/     @devmentor/db    MikroORM: entities, migrations (the only package that touches @mikro-orm)
  ui/     @devmentor/ui    shadcn/ui components and admin building blocks
.ai/                       specs, AI run logs, lessons learned, documentation (docs/)
```

- **Domain concepts instead of modules:** each concept (`auth`, `mentors`, `bookings`, …) is a same-named sub-folder in every layer, e.g. `db/src/entities/auth/user.entity.ts` and `core/src/services/auth/user.service.ts`.
- **Request flow:** endpoint or page (`app`) → `createRequestScope()` (`core`, Awilix) → service (`core`) → `EntityManager` (`db`, MikroORM) → PostgreSQL. Every request gets its own `EntityManager` fork.
- **Database:** entities via `defineEntity`, plural table names (`users`); MikroORM generates migrations and CI checks they match the entities.
- **Shared API and UI layer:** endpoints are built with `apiHandler`/`makeCrudRoute` (uniform `{ ok, data }` / `{ ok, error }` responses, Zod validation, error handling), screens with `apiCall`, `CrudForm` and `DataTable`. Reference example: `/api/users` and `/admin/users`.
- **Configuration:** a single `.env` file at the repository root.
- **Engineering standards:** [`.ai/docs/engineering-standards.md`](.ai/docs/engineering-standards.md) (course standards, lesson 2). Rules for AI agents: [`AGENTS.md`](AGENTS.md) and an `AGENTS.md` in every package.

## Tooling

- **Coding agents:** Claude Code and Codex
- **AI skills:** [`open-mercato/skills`](https://github.com/open-mercato/skills) (installed globally for both agents)
- **GitHub:** code, issues, pull requests and CI in one place; driven from the terminal with GitHub CLI (`gh`)
- **Editor:** Visual Studio Code
- **Environment:** local macOS (Node.js 22), PostgreSQL and the app image in Docker (Docker Desktop)

## Agent comparison (homework, lesson 1)

Both agents got the same task:

> On the home page (`app/page.tsx`), replace the default content with a simple DevMentor welcome screen: a heading, one sentence of description and a "Find a mentor" button. Use Tailwind.

| | Codex | Claude Code |
|---|---|---|
| Heading | Marketing tagline, "DevMentor" as a small label above it | "DevMentor" as the main heading |
| Look | Its own dark theme (navy + teal) | Colors and light/dark mode from the existing template |
| Button | `#mentorzy` link, clear focus outline for keyboard navigation | Next.js `Link` to `/mentorzy` (page doesn't exist yet) |
| Preparation | – | Read `AGENTS.md`, checked library versions and `layout.tsx` |
| Scope of changes | Only `app/page.tsx` | Only `app/page.tsx` |
| Lint and types | ✅ | ✅ |

**Takeaways:**

- Both agents completed the task correctly and didn't touch other files.
- Codex interpreted the prompt more creatively (own style, tagline); Claude Code stuck to the literal wording and the project's conventions.
- The fewer details in the prompt, the more decisions the agent makes on its own – look, copy, button target. Later tasks should pin these down in a spec.
- Codex's version went into the project – it works better as a landing screen and handles button accessibility. The copy was later translated into English.

## Running locally

Run all commands from the repository root.

```bash
npm install
cp .env.example .env
docker compose up -d db     # PostgreSQL in Docker
npm run db:migrate          # creates the tables
npm run dev
```

- app: [http://localhost:3000](http://localhost:3000)
- admin panel: [http://localhost:3000/admin](http://localhost:3000/admin) (user management at `/admin/users` – development mode only until login exists)
- database connection: [http://localhost:3000/api/health](http://localhost:3000/api/health) – `{"status":"ok","database":"ok"}` means the app can reach the database (it returns HTTP 503 when the database is down)

The database listens on `localhost:5432`; the connection string is `DATABASE_URL` in `.env`.

### Database migrations

```bash
npm run db:migration:create   # after changing an entity – generates a new migration
npm run db:migrate            # applies pending migrations
npm run db:migration:check    # checks that entities and migrations are in sync
```

## Tests

```bash
npm test                 # unit tests (Vitest)
npm run test:coverage    # tests + coverage report (coverage/index.html)
npm run test:watch       # watch mode
```

The `core`, `db` and `ui` packages must have **100% unit test coverage** – CI rejects a PR if coverage drops. Tests live next to the code (`*.test.ts` / `*.test.tsx`). The Next.js app (pages, endpoints) is covered by integration tests.

## Running in Docker

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

App and database together:

```bash
docker compose up --build
npm run db:migrate          # on first start – creates the tables (from the host, via localhost:5432)
```

- app: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `localhost:5432` (user, password and database default to `devmentor`; change them in `.env`)

Stop with `docker compose down`. Database data stays in the `db-data` volume; remove it with `docker compose down -v`.

The app image alone, without the database:

```bash
docker build -t devmentor .
docker run -p 3000:3000 devmentor
```

For day-to-day coding use `npm run dev` – on macOS it's faster than running the app in a container. Docker is for the database and for deployments.
