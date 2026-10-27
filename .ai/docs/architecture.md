# Architecture – domain conventions and shared layers

Read this when a task adds or changes a feature, a service, an entity or a route. Dependency direction and the
package layout are in the root `AGENTS.md`.

## Domain concept convention

Domain code is not organized into `modules/`. Each concept (`auth`, `mentors`, `availability`, `bookings`, `payments`, `messages`, `favorites`, `reviews`, ...) is a same-named sub-folder repeated across the layers that need it:

- `packages/db/src/entities/<concept>/<name>.entity.ts`
- `packages/core/src/services/<concept>/<name>.service.ts`
- `packages/core/src/validators/<concept>/` (shared Zod schemas, when needed)
- `packages/app/src/app/api/<concept>/route.ts` and the matching `page.tsx` under the relevant persona route group

Create a concept folder only when its first file is added – never scaffold empty ones. This is a directory convention, not a module runtime: there is no per-concept setup/ACL/auto-discovery. Infrastructure that is not a domain concept lives in `system` (e.g. `services/system/health.service.ts`).

Event IDs follow `concept.entity.action` (e.g. `bookings.booking.created`) and are emitted through the typed emitter in `packages/core/src/events`, registered on the `Cradle` – in-process only; there is no queue/worker in this project.

## Reusable API and UI layer

Every route and every page reuses two shared layers instead of re-implementing fetch/validation/auth/error-handling per feature:

- `packages/core/src/http/` – `errors.ts` (typed `AppError` hierarchy), `apiHandler.ts` (wraps a route: catches `AppError`s, maps to status + JSON envelope, logs unexpected failures), `makeCrudRoute.ts` (schema + service in, `{ GET, POST, PUT, DELETE }` out, for plain CRUD resources), `auth.ts` (`requireSession`, `requireRole`, ownership assertions).
- `packages/ui/src/backend/` – `api/apiCall.ts` (the only sanctioned `fetch()` call site), `forms/CrudForm.tsx`, `tables/DataTable.tsx`, `feedback/{LoadingMessage,ErrorMessage,EmptyState}.tsx`.

**Reference example – copy it for every new resource:** `UserService` (`core/src/services/auth/user.service.ts`) + validators (`core/src/validators/auth/`) → `api/users/users.crud.ts` (`makeCrudRoute`) re-exported by `api/users/route.ts` and `api/users/[id]/route.ts` → `admin/users/` page using `apiCall`, `DataTable` and `CrudForm`.

JSON envelope: `{ ok: true, data }` / `{ ok: false, error: { code, message, fieldErrors? } }`. State-changing requests must send `x-devmentor-client: 1` (CSRF) – `apiCall` does it for you.

## Where a new reusable component goes

1. Shadcn primitive → `ui/src/components/ui/` (via `npx shadcn@latest add`, never hand-written).
2. Generic, concept-agnostic panel pattern → `ui/src/backend/<category>/`.
3. Component tied to one concept's domain shape → `ui/src/components/<concept>/`, named after the same concept folder used in `db`/`core`.
4. Used by exactly one page → colocate next to that `page.tsx` until a second consumer appears.
