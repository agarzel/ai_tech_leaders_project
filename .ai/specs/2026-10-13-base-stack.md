# Spec: Base stack – monorepo, MikroORM, Awilix, shadcn/ui

- **Date:** 2026-10-13
- **Status:** implemented (PR pending review)
- **Source:** AI Tech Leaders course, lesson 2 ("Modyfikujemy / generujemy podstawowy szablon dla naszej aplikacji")

## Goal

Complete the lesson-2 stack on top of the existing Next.js app:

1. **Monorepo** – npm workspaces with a `packages/` folder. The Next.js app moves to `packages/app` (`@devmentor/app`), the main integration package. Future shared code goes into further packages.
2. **MikroORM 7 + PostgreSQL** – ORM with migrations and connection pooling; replaces the plain `pg` pool (`lib/db.ts`).
3. **Awilix** – dependency injection container; services get their dependencies (e.g. a request-scoped `EntityManager`) from it.
4. **shadcn/ui** – component library for admin (backend) pages; Tailwind stays for frontend pages.

## Non-goals

- Business features, auth, CRUD routes – they come with the Engineering Standards (next step) and later lessons.
- Unit/integration tests – separate PR (safety net).

## Design

### Repository layout

```
package.json               workspace root (private), scripts delegate to packages
packages/app/              Next.js app (@devmentor/app)
  app/                     App Router: pages, layouts, route handlers
    admin/                 admin panel (shadcn/ui)
    api/health/            DB health check
  components/ui/           shadcn/ui components
  lib/
    db/                    MikroORM: orm.ts, entities/, migrations/
    di/                    Awilix container
    services/              business services resolved from the container
  mikro-orm.config.ts
.env / .env.example        single env file at the repo root
```

### Environment

One `.env` at the repo root, used by `docker compose`, `next dev` and the MikroORM CLI. `lib/db/config.ts` loads it with Node's `process.loadEnvFile` (variables already set in the environment win). `@next/env`'s `loadEnvConfig` was rejected: it caches the first load, so a second call for the root dir is ignored.

### MikroORM

- Driver `@mikro-orm/postgresql`, migrations `@mikro-orm/migrations`, CLI `@mikro-orm/cli` (TS config loaded via `tsx`).
- Entities with `defineEntity` (no decorators – no extra compiler config for Next.js/Turbopack).
- First entity: `User` (`id` uuid, `email` unique, `name`, `role` = mentor | mentee | admin, `createdAt`, `updatedAt`) + initial migration.
- One `MikroORM` instance per server process (cached on `globalThis` in dev). Each request uses a fork of the EntityManager.
- `@mikro-orm/sql` and the driver are added to `serverExternalPackages`.
- Scripts: `db:migrate` (up), `db:migration:create`, `db:migration:check`.

### Awilix

- `createAppContainer()` registers singletons (`orm`) and services.
- `createRequestScope()` creates a scope with a fresh `em` fork; route handlers resolve services from it.
- Example: `HealthService.check()` used by `GET /api/health`.

### shadcn/ui

- Initialised for Tailwind 4 (`components.json`, `lib/utils.ts`, CSS variables in `globals.css`).
- `/admin` page skeleton built from shadcn components; the public home page keeps plain Tailwind.

### Docker / CI

- Dockerfile builds the workspace; `outputFileTracingRoot` = repo root, standalone server at `packages/app/server.js`.
- CI runs the same root scripts; Next.js build cache path updated.
- New CI job **Database migrations**: PostgreSQL service → `db:migrate` on an empty DB → `db:migration:check` (fails if an entity changed without a migration).
- Migrations are run from the host (`npm run db:migrate`), not inside the production image (the CLI and `tsx` are dev dependencies).

## Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run build` pass from the repo root; CI green.
- `npm run db:migrate` creates the `user` table on a fresh database.
- `GET /api/health` returns 200 via Awilix → HealthService → MikroORM, 503 when the DB is down.
- `/admin` renders with shadcn/ui components.
- `docker compose up --build` serves `/`, `/admin`, `/api/health`.
- README and AGENTS.md describe the new layout and commands.
