# Run: Safety net part 1 – unit tests with a 100% coverage gate

- **Date:** 2026-10-13
- **Agent:** Claude Code
- **Branch:** `unit-tests`
- **Spec:** `.ai/specs/2026-10-13-safety-net.md`

## Goal

Course lesson 2 safety net, part 1: unit test framework, 100% coverage of existing code in `core`/`db`/`ui`, CI job, `AGENTS.md` rule.

## What was done

- Vitest 5.0.4 + `@vitest/coverage-v8`, jsdom, Testing Library (react, user-event, jest-dom). Root `vitest.config.mts` with projects `core`, `db`, `ui`.
- 17 test files, 120 tests, 100% statements/branches/functions/lines.
- CI job "Unit tests" (`npm run test:coverage`, coverage artifact).
- Docs: `AGENTS.md` "Testing – mandatory" section, ui testing note, README "Testy", spec.

## Code changes made for testability or found by tests

- `createLogger(destination?)` – lets tests capture output and verify secret redaction.
- `makeCrudRoute`: `accessGuards` map instead of `if (access === "admin")` – the `false` branch was unreachable (only one access level exists).
- **Bug found by tests:** `LoadingMessage` nested the shadcn `Spinner` (`role="status"`) inside its own `role="status"` – screen readers would announce twice. The spinner is now decorative (`aria-hidden`).

## Decisions

- `vitest.config.mts` (not `.ts`) – the root package is CommonJS, so an ESM config needs the `.mts` extension.
- The Next.js app is excluded from unit coverage; integration tests (part 2) cover pages and route wiring.
- Entity tests use MikroORM metadata discovery without a database (v7 connects lazily).
- Awilix PROXY-injected services are compared by reference in tests – Vitest's pretty-printer touches unknown keys, which strict mode rejects.

## Verification

- `npm run test:coverage` – 120 passed, 100% / 100% / 100% / 100%.
- `npm run lint`, `npm run typecheck` (incl. tests) – pass.

## Handoff

Part 2: integration tests – testcontainers PostgreSQL + agent-browser, home page and admin panel, CI job with screenshots.
