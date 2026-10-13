# Spec: Safety net – unit and integration tests in CI

- **Date:** 2026-10-13
- **Status:** part 1 merged (#9); part 2 (integration tests) implemented
- **Source:** course lesson 2, "Safety net – siatka bezpieczeństwa" + homework (CI that checks compilation and unit and/or integration tests)

## Goal

Every PR is checked automatically so reviewers don't have to read every line:

1. **Unit tests** (this PR): Vitest for `core`, `db`, `ui`; 100% coverage gate in CI; `AGENTS.md` rule that every new feature is 100% covered.
2. **Integration tests** (next PR): the app started against an ephemeral PostgreSQL from testcontainers (migrated + seeded), driven by agent-browser in headless Chrome; basics covered – home page and admin panel; screenshots as CI artifacts.

## Design – unit tests

- Root `vitest.config.mts` with three projects (`core`, `db` – Node; `ui` – jsdom + Testing Library + jest-dom). Colocated `*.test.ts(x)`.
- Coverage (v8) over `packages/{core,db,ui}/src`, thresholds 100/100/100/100. Excluded by design: barrels, type-only modules, generated shadcn primitives, migrations, the Next.js app (covered by integration tests).
- Boundaries are mocked (EntityManager, fetch, container, env); entity metadata is tested through MikroORM discovery without a database (connections are lazy in v7).
- CI job **Unit tests** runs `npm run test:coverage` and uploads `coverage/` as an artifact.

## Design – integration tests

- `vitest.integration.config.mts` (separate from unit tests and coverage), tests in `packages/app/tests/integration/`.
- Global setup: `@testcontainers/postgresql` (`postgres:17-alpine`) → `npm run db:migrate` → seed via `psql` in the container → `npm run dev` with `PORT=3100`, `NEXT_DIST_DIR=.next-test` and the container's `DATABASE_URL` → wait for `/api/health`. Teardown kills the server's process group and stops the container.
- The app runs in development mode because admin endpoints are closed in production until auth exists.
- Browser: agent-browser CLI via a small `Browser` helper (one session per file); semantic locators (role + name, label).
- Covered: home page, health endpoint, admin panel (sections, streamed DB status, navigation), admin users CRUD (list seeded user, client validation, create, server conflict, edit, delete).
- CI job **Integration tests**: `agent-browser install --with-deps`, `npm run test:integration`, screenshots + server log as artifact.

## Acceptance criteria (part 2)

- `npm run test:integration` passes locally and in CI; no containers or processes left behind.
- `AGENTS.md` describes how to run and write integration tests.

## Acceptance criteria (part 1)

- `npm run test:coverage` passes with 100% on all four metrics; CI job green.
- Lint and typecheck include the test files.
- `AGENTS.md` states the 100% rule and the testing conventions.
