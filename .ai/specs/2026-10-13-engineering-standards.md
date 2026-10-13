# Spec: Engineering Standards – package split and concept folders

- **Date:** 2026-10-13
- **Status:** PR A implemented (pending review); PR B to do
- **Source:** course lesson 2, `2026-09-01-engineering-standards.md` (stored as `.ai/docs/engineering-standards.md`)

## Goal

Adopt the course's Engineering Standards. Delivered in two PRs (the standards themselves ask for incremental, buildable steps):

**PR A (this spec, step 1 + AGENTS.md):**

1. Split `packages/app` into four workspaces with an ESLint-enforced dependency direction `app → core → db`, `ui` importable by `app` only:
   - `@devmentor/db` – MikroORM config, entities, migrations. The only package that imports `@mikro-orm/*`.
   - `@devmentor/core` – Awilix container + cradle, services. Never imports `next`/`react`.
   - `@devmentor/ui` – shadcn/ui primitives (later: `backend/` panel building blocks).
   - `@devmentor/app` – Next.js (HTTP + pages) under `src/app`.
2. Concept folders: `entities/auth/user.entity.ts`, `services/system/health.service.ts`.
3. Naming: DB tables plural snake_case → migration renaming `user` to `users`; shared `base.entity.ts` properties (uuid id, timestamps).
4. Store the standards in `.ai/docs/engineering-standards.md` (with an adaptations preface) and apply the Section 3 changes to `AGENTS.md`; per-package `AGENTS.md`.

**PR B (follow-up):** reusable layers – `core/src/http` (`errors`, `apiHandler`, `makeCrudRoute`), `core/src/config/env.ts` (Zod), logger, `ui/src/backend` (`apiCall`, `CrudForm`, `DataTable`, `feedback`), `UserService` + `/api/users` + `/admin/users` as the reference example. `auth.ts` and events arrive with the first feature that needs them (YAGNI, standards §5.4).

## Design (PR A)

### Packages

Internal packages are consumed as TypeScript source (no build step): each `package.json` has `exports` pointing at `src/`, and Next.js compiles them via `transpilePackages`. Shared compiler options in `tsconfig.base.json`; every package has its own `tsconfig.json` and `typecheck` script.

```
packages/
  app/   src/app/...           (Next.js), public/, next.config.ts
  core/  src/container/{container.ts,cradle.ts}, src/services/system/health.service.ts, src/index.ts
  db/    src/entities/{base.entity.ts,auth/user.entity.ts,index.ts}, src/{config.ts,orm.ts,index.ts}, src/migrations/, mikro-orm.config.ts
  ui/    src/components/ui/*, src/lib/utils.ts, components.json
```

- `@devmentor/db` re-exports the MikroORM types other packages need (`EntityManager`, `MikroORM`), so nothing else imports `@mikro-orm/*`.
- Tailwind (in `app`) scans `ui` sources via `@source`.
- `db:*` scripts live in `@devmentor/db`; root scripts delegate.

### Lint boundaries

One root `eslint.config.mjs` (Next.js rules scoped to `packages/app`) with `no-restricted-imports` per package:

| Package | May not import |
|---|---|
| db | `@devmentor/core`, `@devmentor/ui`, `@devmentor/app`, `next`, `react` |
| core | `@devmentor/ui`, `@devmentor/app`, `next`, `react`, `@mikro-orm/*` |
| ui | `@devmentor/core`, `@devmentor/db`, `@devmentor/app`, `@mikro-orm/*` |
| app | `@mikro-orm/*` |

## Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run build` pass from the root; CI green (incl. migrations job).
- An import that breaks the direction (e.g. `@devmentor/core` from `ui`) fails lint.
- Fresh DB: migrations create `users`; existing DB: `user` is renamed to `users` without data loss.
- `/`, `/admin`, `/api/health` behave as before (incl. 503 when the DB is down); Docker image works.
