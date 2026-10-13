# Spec: Safety net – unit and integration tests in CI

- **Date:** 2026-10-13
- **Status:** part 1 (unit tests) implemented; part 2 (integration tests) to do
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

## Acceptance criteria (part 1)

- `npm run test:coverage` passes with 100% on all four metrics; CI job green.
- Lint and typecheck include the test files.
- `AGENTS.md` states the 100% rule and the testing conventions.
