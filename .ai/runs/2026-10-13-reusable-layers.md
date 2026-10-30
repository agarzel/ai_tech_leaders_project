# Run: Engineering Standards – PR B (reusable API & UI layers)

- **Date:** 2026-10-13
- **Agent:** Claude Code
- **Branch:** `reusable-layers`
- **Spec:** `.ai/specs/implemented/2026-10-13-engineering-standards.md` (PR B); standards §1 "Reusable API & UI Layer", §5 steps 2–3

## Goal

Build the shared layers every later concept reuses, and prove them with one reference example (users CRUD).

## What was done

- **core:** `config/env.ts` (Zod), `logger.ts` (pino, redaction), `http/errors.ts`, `http/apiHandler.ts`, `http/makeCrudRoute.ts`, `http/crud.ts`, `http/auth.ts` (temporary `requireAdmin`), `services/auth/user.service.ts` (DTOs, explicit fields, conflict mapping), `validators/auth/user-{create,update}.schema.ts`. Logger and UserService registered in the container; HealthService logs via the injected logger.
- **db:** client-safe `@devmentor/db/constants` (`USER_ROLES`), `UniqueConstraintViolationException` re-export.
- **ui:** shadcn `table`, `input`, `label`, `alert`, `spinner`, `native-select`; `backend/api/apiCall.ts` (+ types), `backend/feedback/*`, `backend/tables/DataTable.tsx`, `backend/forms/CrudForm.tsx`.
- **app:** `api/users` (+ `[id]`) via `makeCrudRoute`; `/admin/users` with `apiCall` + `DataTable` + `CrudForm`; Users card on `/admin` links to it.

## Decisions

- **CSRF:** every state-changing request needs `x-devmentor-client: 1`; `apiCall` sends it. The header name is declared in both core and ui (ui must not import core) – same "shape convention" the standards use for the envelope.
- **No auth yet → fail closed:** `makeCrudRoute` requires an explicit `access`; `"admin"` calls `requireAdmin()`, which allows development/test and returns 403 in production. To be replaced by `requireSession` + `requireRole`.
- **DTOs, not entities:** services return plain DTOs (ISO dates), so no MikroORM objects reach responses.
- **Validators on a subpath export** (`@devmentor/core/validators/*`) so client components can import schemas without pulling MikroORM into the browser bundle. Roles come from `@devmentor/db/constants` for the same reason.
- **Malformed ids → 404** (validated as UUID before hitting the DB).
- **apiHandler reads request headers first** – needed for CSRF/request id, and it keeps route handlers request-time under Cache Components.
- **Env loading:** `getEnv()` runs when the container is created (fail fast at first request, not at build); the logger reads `LOG_LEVEL` directly so imports never fail at build time.
- **Delete confirmation** is an inline two-step button (no browser `confirm()` dialog).

## Verification

- `npm run lint`, `npm run typecheck`, `npm run build` – pass.
- API (dev, real DB): create 201 (email lower-cased); duplicate email 409 with `fieldErrors.email`; invalid input 400 with per-field messages (extra `id` ignored); missing client header 403; malformed JSON 400; list + pagination 200; `pageSize=1000` 400; get/update 200; malformed id 404; delete 200 then 404.
- Bug found and fixed: collection routes receive no `params` from Next.js → `ctx.params` is optional now (was a 500, correctly logged and masked).
- Browser (`/admin/users`): table renders; empty submit shows client-side errors under Name and Email; duplicate email shows the server error under Email; Cmd+Enter submits. Console hydration warnings come from a browser extension (`bis_skin_checked` attributes), not the app.
- Docker (production): `/api/users` → 403 (fail closed), `/api/health` → 200.

## Open issues / handoff

- No unit/integration tests yet – next step (lesson 2 safety net): Vitest for `apiHandler`, `makeCrudRoute`, `UserService`, `apiCall`, `CrudForm` helpers; testcontainers for the API.
- Events (`core/src/events`) and real auth come with the first features that need them.
