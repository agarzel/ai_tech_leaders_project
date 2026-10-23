# Backward compatibility

What DevMentor treats as a **protected contract surface** and how a change to one must be handled. Review skills check PRs against this file; implementation skills warn when a change is not compliant.

**Project stage:** pre-1.0, no external consumers yet. Breaking changes are allowed, but only deliberately: the PR must say so (label `risk-high`, a "Breaking change" note in the PR body) and update every consumer inside this repository in the same PR. From 1.0 on, the deprecation rules below apply in full.

## Protected surfaces

### 1. HTTP API (`packages/app/src/app/api/**`)

Current routes: `GET /api/health`; `GET, POST /api/users`; `GET, PUT, DELETE /api/users/{id}`.

- **The response envelope is a contract:** `{ ok: true, data }` / `{ ok: false, error: { code, message, fieldErrors? } }`, produced by `apiHandler` and parsed by `apiCall`. Error `code` values (`validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `internal_error`) are part of it.
- **The CSRF header** `x-devmentor-client: 1` on POST/PUT/PATCH/DELETE is shared by `apiHandler` (core) and `apiCall` (ui); the two must change together.
- `GET /api/health` returns `{ status, database }` with 200/503 – used by Docker/compose checks and the integration test setup.
- **Breaking:** removing or renaming a route, field or error code; changing a field's type or meaning; making an optional request field required; changing status codes or pagination parameters (`page`, `pageSize`, max 100).
- **Non-breaking:** adding routes, adding optional request fields, adding response fields.
- **Security fix, allowed (Epic 01 task 1.5):** `/api/users` keeps its paths, methods and envelope, but `requireAdmin` now needs a valid admin session – an anonymous caller gets `401 unauthorized` (a signed-in non-admin `403 forbidden`) instead of data; there is no development bypass any more. The PR states it; local development and integration tests create an admin with `npm run auth:set-password -- --email <e> --admin`.
- **Required path:** add the new shape alongside the old one, migrate callers (`apiCall` users, integration tests), then remove the old one in a later PR. Pre-1.0: may be done in one PR if all callers are updated.

### 2. Database schema and migrations (`packages/db/src/migrations/`)

- Migrations are append-only: **a merged migration is never edited or deleted**; every change is a new migration.
- **Breaking:** dropping or renaming tables/columns, narrowing types, adding `NOT NULL` without a default/backfill, changing enum values (e.g. `users.role`), dropping unique constraints.
- **Required path:** rename in place (`alter table … rename`), never drop + create; backfill before tightening constraints; include the down migration; for `risk-high` schema changes add an up/down test and a rollback plan in the PR body (see `SDLC.md`).
- Table names are plural snake_case; the MikroORM snapshot (`.snapshot-devmentor.json`) is committed with every migration.

### 3. Package public APIs (`@devmentor/*` exports)

Each package exposes only what its `package.json` `exports` map lists:

- `@devmentor/db` – `.` (ORM config, `getOrm`, entities, `EntityManager`/`MikroORM` types, `UniqueConstraintViolationException`) and `./constants` (client-safe, e.g. `USER_ROLES`).
- `@devmentor/core` – `.` (container, `createRequestScope`, `apiHandler`, `makeCrudRoute`, errors, logger, env, services, DTO types) and `./validators/*` (client-safe Zod schemas).
- `@devmentor/ui` – `./components/ui/*`, `./components/*` (product components by concept, e.g. `./components/auth/AccountMenu`), `./backend/*`, `./backend/api/*`, `./lib/utils`, `./lib/*` (formatting and time helpers, e.g. `./lib/format`, `./lib/time`), `./styles/*` (design tokens `tokens.css` and the Tailwind mapping `theme.css`, imported by the app's `globals.css`).
- **Breaking:** removing or renaming an export or subpath, changing a function signature or DTO shape, moving a client-safe entry point so that it pulls server code (MikroORM) into the browser.
- **Required path:** update all importers in the same PR (the monorepo makes this checkable with `npm run typecheck`); keep client-safe entry points free of server imports.

### 4. Configuration and environment

- Environment variables: `DATABASE_URL`, `AUTH_SECRET`, `NODE_ENV`, `LOG_LEVEL` (validated in `packages/core/src/config/env.ts`), `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` (compose), `NEXT_DIST_DIR`, `INTEGRATION_APP_PORT`, `PORT`; `DEVMENTOR_PASSWORD` (read only by `auth:set-password`, never stored).
- `.env.example`, `docker-compose.yml` service names (`app`, `db`) and the single root `.env` convention.
- `.ai/agentic.config.json` – read by every `om-*` skill.
- **Breaking:** renaming or removing a variable, making an optional one required, changing defaults that alter behaviour, renaming compose services.
- **Required path:** support the old name for at least one release (read both), update `.env.example`, README and CI in the same PR.

### 5. Developer commands

Root npm scripts are used by CI, the validation gate, docs and agents: `setup`, `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:coverage`, `test:watch`, `test:integration`, `test:integration:setup`, `db:migrate`, `db:migration:create`, `db:migration:check`, `auth:set-password`, `storybook`, `build-storybook`, `test:storybook`, `lint:tokens`, `docs:design-system`, `docs:design-system:check`.

- **Breaking:** renaming or removing a script, or changing what it checks so that it proves less.
- **Required path:** update `.github/workflows/ci.yml`, `.ai/agentic.config.json`, `SDLC.md`, `AGENTS.md` and README in the same PR.

### 6. Domain events (planned)

No events are emitted yet. Once they are, event IDs (`concept.entity.action`, e.g. `bookings.booking.created`) and their payloads become a contract: add fields freely, never rename or remove without a deprecation window.

## Not protected

Internal module layout inside a package (anything not reachable through `exports`), UI markup and styling (covered by QA, not by this file), test helpers, and the content of `.ai/runs/`.
