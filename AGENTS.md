# DevMentor – instructions for coding agents

DevMentor is a mentoring marketplace for developers (mentors, mentees, admins), built during the AI Tech Leaders course. See `README.md` for the product scope.

This is an npm-workspaces monorepo. Each package may have its own `AGENTS.md` with package-specific rules – read it before working inside that package (e.g. `packages/app/AGENTS.md` for the Next.js app).

## Stack

- Monorepo: npm workspaces – `app`, `core`, `db`, `ui` in `packages/`
- Next.js 16 (App Router, Cache Components enabled), React 19, TypeScript
- PostgreSQL 17 (via `docker compose`) with **MikroORM 7** (entities via `defineEntity`, migrations)
- **Awilix** – dependency injection container
- Tailwind CSS 4 for frontend pages, **shadcn/ui** (Base UI, `base-nova` style) for admin pages

These are fixed choices from the course (lesson 2). Do not introduce alternative libraries for these concerns (no Prisma/Drizzle/raw `pg`, no other DI container or UI kit).

UI language and all project documentation (`README.md`, `AGENTS.md`, `.ai/`) are in English.

## Monorepo layout

```
packages/
  app/    @devmentor/app  – Next.js: HTTP (route handlers) and pages, src/app/
  core/   @devmentor/core – business logic: Awilix container + cradle, services, http layer, validators, env, logger
  db/     @devmentor/db   – MikroORM: config, entities, migrations
  ui/     @devmentor/ui   – presentation: shadcn/ui primitives, backend/ panel building blocks
.ai/                      Metadata for AI-assisted work (see below)
.github/workflows/        CI
Dockerfile, docker-compose.yml
.env.example              Copy to .env – the single env file for the whole repo
tsconfig.base.json        Shared TypeScript options
eslint.config.mjs         Lint rules for all packages, incl. dependency boundaries
```

Each package has its own `AGENTS.md` – read it before working inside that package.

**Dependency direction (enforced by ESLint `no-restricted-imports`):** `app → core → db`; `ui` is importable by `app` only. Only `db` imports `@mikro-orm/*` (others use its type re-exports); `core` never imports `next`/`react`; `app` never imports `db` directly. Do not loosen these rules for convenience.

Internal packages are consumed as TypeScript source (`exports` → `src/`, compiled by Next.js via `transpilePackages`). Run npm commands from the repo root; root scripts delegate to the workspaces. Add a dependency to the package that uses it: `npm install <pkg> -w @devmentor/<name>`.

### Domain concept convention

Domain code is not organized into `modules/`. Each concept (`auth`, `mentors`, `availability`, `bookings`, `payments`, `messages`, `favorites`, `reviews`, ...) is a same-named sub-folder repeated across the layers that need it:

- `packages/db/src/entities/<concept>/<name>.entity.ts`
- `packages/core/src/services/<concept>/<name>.service.ts`
- `packages/core/src/validators/<concept>/` (shared Zod schemas, when needed)
- `packages/app/src/app/api/<concept>/route.ts` and the matching `page.tsx` under the relevant persona route group

Create a concept folder only when its first file is added – never scaffold empty ones. This is a directory convention, not a module runtime: there is no per-concept setup/ACL/auto-discovery. Infrastructure that is not a domain concept lives in `system` (e.g. `services/system/health.service.ts`).

Event IDs follow `concept.entity.action` (e.g. `bookings.booking.created`) and are emitted through the typed emitter in `packages/core/src/events`, registered on the `Cradle` – in-process only; there is no queue/worker in this project. (Not implemented yet – add it with the first feature that emits an event.)

### Reusable API & UI layer

Every route and every page reuses two shared layers instead of re-implementing fetch/validation/auth/error-handling per feature:

- `packages/core/src/http/` – `errors.ts` (typed `AppError` hierarchy), `apiHandler.ts` (wraps a route: catches `AppError`s, maps to status + JSON envelope, logs unexpected failures), `makeCrudRoute.ts` (schema + service in, `{ GET, POST, PUT, DELETE }` out, for plain CRUD resources), `auth.ts` (`requireSession`, `requireRole`, ownership assertions).
- `packages/ui/src/backend/` – `api/apiCall.ts` (the only sanctioned `fetch()` call site), `forms/CrudForm.tsx`, `tables/DataTable.tsx`, `feedback/{LoadingMessage,ErrorMessage,EmptyState}.tsx`.

Implemented. `auth.ts` currently has only a temporary `requireAdmin()` (open in development, 403 in production) – real `requireSession`/`requireRole` arrive with the `auth` concept.

**Reference example – copy it for every new resource:** `UserService` (`core/src/services/auth/user.service.ts`) + validators (`core/src/validators/auth/`) → `api/users/users.crud.ts` (`makeCrudRoute`) re-exported by `api/users/route.ts` and `api/users/[id]/route.ts` → `admin/users/` page using `apiCall`, `DataTable` and `CrudForm`.

JSON envelope: `{ ok: true, data }` / `{ ok: false, error: { code, message, fieldErrors? } }`. State-changing requests must send `x-devmentor-client: 1` (CSRF) – `apiCall` does it for you.

New reusable components have one designated home each – never scattered ad hoc:

1. Shadcn primitive → `ui/src/components/ui/` (via `npx shadcn@latest add`, never hand-written).
2. Generic, concept-agnostic panel pattern → `ui/src/backend/<category>/`.
3. Component tied to one concept's domain shape → `ui/src/components/<concept>/`, named after the same concept folder used in `db`/`core`.
4. Used by exactly one page → colocate next to that `page.tsx` until a second consumer appears.

### Engineering standards

The full standards – naming table, principles (SRP, DRY, dependency inversion, YAGNI, fail closed, idempotency), security minimums, code quality rules and the code review checklist – are in `.ai/docs/engineering-standards.md`. Follow them; its preface lists the adaptations for this repo (Next.js 16 `connection()` instead of `force-dynamic`, MikroORM 7 `defineEntity`).

Key naming rules: packages `@devmentor/<name>`; tables plural snake_case (`users`), columns snake_case; entities PascalCase singular in `<name>.entity.ts`; services `<Name>Service` in `<name>.service.ts`; cradle keys camelCase; Zod schemas `<name>Schema` in `<name>.schema.ts`; pages default-export `<Segment>Page`.

## Testing – mandatory

**Every new feature and every change must be 100% covered by unit tests** (statements, branches, functions, lines) for `@devmentor/core`, `@devmentor/db` and `@devmentor/ui`. CI fails below 100% – do not lower the thresholds, do not add `/* v8 ignore */` comments and do not widen the coverage `exclude` list to get green. If code is genuinely unreachable, delete it or restructure it.

- **Runner:** Vitest (`vitest.config.mts`, one project per package: `core` and `db` in Node, `ui` in jsdom with Testing Library).
- **Location:** colocated `<file>.test.ts(x)` next to the code it tests.
- **Excluded from unit coverage (by design):** barrels (`src/index.ts`), type-only modules, generated shadcn primitives (`ui/src/components/ui/`), migrations (checked by the CI migrations job), and the Next.js app (`packages/app` – pages and route wiring are covered by integration tests).
- **Style:** test behaviour through the public API; mock only boundaries (database `EntityManager`, `fetch`, the container, env). Arrange / act / assert, one behaviour per test, descriptive names.
- A bug fix ships with a regression test that fails without the fix.
- `vi.mock` must be called at the top level of a test file (Vitest 5 throws otherwise); `clearMocks` is on by default.

## The `.ai` folder – mandatory

All AI agents working in this repository MUST use these structures:

- `.ai/specs/` – specifications for spec-driven development (SDD).
  - File name: `YYYY-MM-DD-slug.md` (date the spec was created, short kebab-case slug).
  - Write or update a spec **before** implementing any non-trivial feature, and keep it in sync with what was built.
  - `.ai/specs/implemented/` – move a spec here once it is fully implemented and merged.
  - `.ai/specs/archive/` – move specs here that were abandoned or superseded.
- `.ai/runs/` – one log per autonomous AI run (implementing a feature, fixing a bug, refactoring).
  - File name: `YYYY-MM-DD-slug.md`.
  - Contents: goal, plan, decisions made and why, what was verified (commands + results), open issues, and a handoff section so another agent can resume if the run is interrupted.
- `.ai/docs/` – long-lived project documentation (e.g. `engineering-standards.md`).
- `.ai/lessons.md` – short, durable lessons learned (bugs found, gotchas, conventions discovered). Append an entry after fixing a bug, after a correction from the user, or whenever something is worth remembering long term.
  - `.ai/lessons/` – longer write-ups; link them from `lessons.md`.
  - Read `.ai/lessons.md` before starting work.

Use today's date in file names. Never delete specs, runs or lessons – move them instead.

## Commands

All from the repo root:

```bash
npm run dev                    # dev server on http://localhost:3000
npm run lint                   # ESLint (all packages, incl. dependency boundaries)
npm run typecheck              # next typegen + tsc --noEmit (all workspaces)
npm run build                  # production build (output: standalone)
npm test                       # unit tests (Vitest, all packages)
npm run test:coverage          # unit tests + 100% coverage gate (what CI runs)
npm run test:watch             # watch mode
npm run db:migrate             # apply pending migrations
npm run db:migration:create    # generate a migration from entity changes
npm run db:migration:check     # fail if entities and migrations are out of sync
docker compose up -d db        # PostgreSQL only (for npm run dev)
docker compose up --build      # app + PostgreSQL in containers
```

## Workflow rules

- Work on a feature branch and open a pull request against `main`; never commit directly to `main`.
- Every PR must pass CI (lint, typecheck, build, unit tests with 100% coverage, database migrations, Docker image) before merge.
- Before finishing, run `npm run lint`, `npm run typecheck`, `npm run test:coverage` and `npm run build` locally and report the results honestly.
- Plan before coding anything non-trivial; if the plan turns out wrong, stop and re-plan instead of pushing on.
- Prefer the simplest change that solves the problem; touch only what the task needs.
- Keep this file up to date: when you add a convention, command, folder or tool, document it here in the same PR.
