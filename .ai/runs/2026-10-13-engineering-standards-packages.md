# Run: Engineering Standards – PR A (package split, concept folders)

- **Date:** 2026-10-13
- **Agent:** Claude Code
- **Branch:** `engineering-standards`
- **Spec:** `.ai/specs/2026-10-13-engineering-standards.md`
- **Source doc:** `.ai/docs/engineering-standards.md` (course file `2026-09-01-engineering-standards.md` + adaptations preface)

## Goal

Adopt the course's Engineering Standards, step 1: split the single `packages/app` into `app`/`core`/`db`/`ui` with an enforced dependency direction, move code into concept folders, follow the naming rules, and update `AGENTS.md` (standards §3, §5.1, §5.7).

## Decisions

- **Owner decision:** follow the course's four-package structure (not folders inside one package), so later lessons map 1:1.
- **Source-only internal packages:** `exports` → `src/*.ts(x)`, compiled by Next.js `transpilePackages`; no per-package build step. `type: module` for core/db/ui.
- **One root ESLint config** with `no-restricted-imports` per package (Next.js rules scoped via `settings.next.rootDir`). Verified that 5 forbidden imports (ui→core, core→next, core→@mikro-orm, app→db, db→core) all fail.
- **`app` may not import `db`** (stricter than the doc's "app → core → db" wording, which implies it) – the app reaches data only through core services.
- **db re-exports `EntityManager`/`MikroORM` types** so core needs no `@mikro-orm/*` import.
- **`baseProperties()` function** instead of a base class / shared object – each entity gets fresh property builders.
- **Table rename `user` → `users`:** MikroORM generated drop + create (data loss). Rewrote `Migration20261013124642` as `alter table rename` + constraint renames. Verified: existing row survives, down/up round-trip works, fresh DB migrates and `migration:check` passes.
- **Concept for infrastructure:** `services/system/health.service.ts`.
- **Tailwind:** `@source "../../../ui/src"` in the app's `globals.css` so classes used by ui components are generated (verified in the built CSS).
- `HomePage` rename – page naming rule.
- Reusable API/UI layer documented in `AGENTS.md` as "being added in PR B" so agents don't hand-roll alternatives meanwhile.

## Verification

- `npm run lint` – pass (+ boundary violations fail as expected)
- `npm run typecheck` – pass for app, core, db, ui
- `npm run build` – pass
- `npm run dev` – `/api/health` 200, `/admin` 200
- `docker compose up --build`: `/`, `/admin` (streams "Database: connected"), `/api/health` – 200; db stopped → 503; recovers
- Migrations: see decisions above.

## Handoff / next steps (PR B)

1. `core/src/config/env.ts` (Zod-validated env), logger (`pino` with redaction).
2. `core/src/http/`: `errors.ts`, `apiHandler.ts`, `makeCrudRoute.ts`.
3. `ui/src/backend/`: `api/apiCall.ts`, `forms/CrudForm.tsx`, `tables/DataTable.tsx`, `feedback/*`.
4. Reference example: `UserService` (`core/src/services/auth/`), validators, `/api/users` via `makeCrudRoute`, `/admin/users` via `apiCall` + `DataTable`.
5. `auth.ts` and events with the first feature that needs them.
