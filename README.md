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
- **AI skills:** [`open-mercato/skills`](https://github.com/open-mercato/skills) – installed per project in `.agents/skills` (Codex) with `.claude/skills` symlinks (Claude Code); install/refresh with `npx skills add open-mercato/skills --skill '*' --agent claude-code codex`
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

Run all commands from the repository root. Requires Node.js 22 and Docker Desktop running.

```bash
npm run setup     # installs dependencies, creates .env, starts PostgreSQL, applies migrations
npm run dev
```

`npm run setup` is safe to run again at any time: it checks each step and skips what is already done (it never overwrites an existing `.env`), so it also brings an older checkout up to date – new dependencies, pending migrations, a stopped database.

<details>
<summary>Manual steps (what <code>npm run setup</code> does)</summary>

```bash
npm install
cp .env.example .env
docker compose up -d db     # PostgreSQL in Docker
npm run db:migrate          # creates the tables
npm run dev
```

</details>

- app: [http://localhost:3000](http://localhost:3000)
- admin panel: [http://localhost:3000/admin](http://localhost:3000/admin) (user management at `/admin/users` – requires an admin session, see below)
- database connection: [http://localhost:3000/api/health](http://localhost:3000/api/health) – `{"status":"ok","database":"ok"}` means the app can reach the database (it returns HTTP 503 when the database is down)

The database listens on `localhost:5432`; the connection string is `DATABASE_URL` in `.env`.

`AUTH_SECRET` in `.env` is required (at least 32 characters; the app refuses to start without it). Generate one with `openssl rand -base64 32`; never commit a real value.

Payments are configured in `.env` too (all validated at startup; the app refuses to start when one is wrong):

| Variable | Meaning |
| --- | --- |
| `PAYMENTS_PROVIDER` | `fake` (no network, development and tests; refused when `NODE_ENV=production`) or `stripe` (Stripe Checkout, cards only). Required. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Required when the provider is `stripe`; use test-mode keys outside production. |
| `SWEEP_SECRET` | At least 32 characters. Protects the sweep endpoint and signs the fake provider's webhook events. |
| `APP_URL` | Public base URL (`http` or `https`); Checkout success and cancel URLs are built from it. |

Deadlines and recovery (releasing unpaid holds, expiring unanswered bookings, refunds) run only when something calls the sweep, so every deployed environment needs a scheduler that posts to it every few minutes, for example `curl -fsS -X POST -H "x-sweep-token: $SWEEP_SECRET" -H "x-devmentor-client: 1" "$APP_URL/api/system/sweep"`. The provider's webhook goes to `POST /api/payments/webhook`.

### First admin

Admin pages and `/api/users` need an admin session. Once after `npm run setup`, create your admin (or reset any account's password) against the database in `.env`:

```bash
read -rs DEVMENTOR_PASSWORD && export DEVMENTOR_PASSWORD   # 12-128 characters; typed silently, never logged
npm run auth:set-password -- --email you@example.com --admin
```

Without `--admin` the script only sets the password of an existing account and keeps its role. It reads the password from `DEVMENTOR_PASSWORD`, never from an argument.

### Database migrations

```bash
npm run db:migration:create   # after changing an entity – generates a new migration
npm run db:migrate            # applies pending migrations
npm run db:migration:check    # checks that entities and migrations are in sync
```

### Demo data

```bash
npm run db:seed               # demo accounts: admin@, mentor@ and mentee@devmentor.test
```

The seed is idempotent: an email that already exists is skipped, so a second run creates nothing. It seeds no passwords; set one with `npm run auth:set-password -- --email mentor@devmentor.test` (see above). The demo mentor has prices and a public page at `/m/demo-mentor`. Development and test databases only.

## Tests

```bash
npm test                 # unit tests (Vitest)
npm run test:coverage    # tests + coverage report (coverage/index.html)
npm run test:watch       # watch mode
```

The `core`, `db` and `ui` packages must have **100% unit test coverage** – CI rejects a PR if coverage drops. Tests live next to the code (`*.test.ts` / `*.test.tsx`).

### Integration tests

```bash
npm run test:integration:setup   # once: downloads Chrome for agent-browser
npm run test:integration         # requires Docker running
```

Each run starts a fresh PostgreSQL in Docker ([testcontainers](https://testcontainers.com/)), applies the migrations, seeds test data, boots the app and drives it in headless Chrome with [agent-browser](https://agent-browser.dev) – home page, admin panel and the full user CRUD flow. Nothing is left behind afterwards. Screenshots and the app log land in `packages/app/tests/integration/.artifacts/` (CI uploads them as an artifact).

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
