# Run: Safety net part 2 – integration tests (testcontainers + agent-browser)

- **Date:** 2026-10-13
- **Agent:** Claude Code
- **Branch:** `integration-tests`
- **Spec:** `.ai/specs/implemented/2026-10-13-safety-net.md`

## Goal

Course lesson 2 safety net, part 2: the app ephemerally instantiated against a testcontainers PostgreSQL and tested in a browser with agent-browser; basics covered (home page, admin panel); CI job with screenshots.

## What was done

- Dev deps: `testcontainers` / `@testcontainers/postgresql` 12.2.1, `agent-browser` 0.39.0.
- `vitest.integration.config.mts`, `packages/app/tests/integration/{global-setup.ts,support/,home.int.test.ts,admin.int.test.ts}` – 11 tests, ~12 s locally including container and server start.
- `next.config.ts`: `distDir` from `NEXT_DIST_DIR` so the test server (`.next-test`) never clashes with a running `npm run dev`.
- Admin users table: row actions got unique accessible names (`Edit {name}`, `Delete {name}`, …) – needed to target them, and an accessibility fix (several identical "Delete" buttons were indistinguishable for screen readers).
- CI job "Integration tests" with artifacts; scripts `test:integration`, `test:integration:setup`.
- Docs: AGENTS.md (integration testing rules), app AGENTS.md, README, spec.

## Decisions

- **Dev server, not the production build:** admin endpoints fail closed in production until auth exists, so CRUD flows can only run in development mode. Revisit when auth lands.
- **Seed via `psql` inside the container** – no extra DB client dependency.
- **agent-browser CLI wrapped in a `Browser` class** – semantic locators, exit codes as assertions, readable failure messages from the CLI.
- **agent-browser declares Node >= 24** but ships native binaries; the JS wrapper runs fine on Node 22 (npm prints an engine warning only).

## Verification

- `npm run test:integration` – 11 passed; afterwards no test container, nothing listening on 3100.
- Screenshots checked (e.g. the conflict error is shown under the email field).
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:coverage` (120 passed, 100%) – pass.

## Open issues / handoff

- When auth exists: run integration tests against the production build and add login to the setup.
