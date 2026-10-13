# Run: base stack – monorepo, MikroORM, Awilix, shadcn/ui

- **Date:** 2026-10-13
- **Agent:** Claude Code
- **Branch:** `base-stack`
- **Spec:** `.ai/specs/2026-10-13-base-stack.md`

## Goal

Complete the course lesson-2 stack: npm-workspaces monorepo (`packages/app`), MikroORM 7 with the first migration (replacing the plain `pg` pool), Awilix DI, shadcn/ui for the admin panel. Keep Docker and CI working.

## What was done

1. Spec written first.
2. Moved the Next.js app to `packages/app` (`git mv`), root `package.json` with workspaces and delegating scripts; lockfile regenerated.
3. MikroORM 7.2.5 (`core`, `postgresql`, `migrations`; `cli` + `tsx` as dev deps). `User` entity via `defineEntity`, initial migration `Migration20261013122932` (+ snapshot). Scripts `db:migrate`, `db:migration:create`, `db:migration:check`.
4. Awilix 13: app container (singleton `orm`, scoped services) + `createRequestScope()` with an `em` fork. `HealthService` used by `/api/health` and `/admin`.
5. shadcn/ui 4 (`base-nova`, Base UI): button, card, badge; `/admin` skeleton with live DB status (Suspense + `connection()`).
6. Dockerfile for the monorepo (standalone server at `packages/app/server.js`), `.dockerignore` and `.gitignore` patterns un-anchored for nested `.next`/`node_modules`.
7. CI: cache path updated, new "Database migrations" job.
8. Docs: root `AGENTS.md` (monorepo, stack, commands), new `packages/app/AGENTS.md` + `CLAUDE.md`, README (stack, architecture, commands).

## Decisions

- **`defineEntity` instead of decorators** – no `experimentalDecorators`/metadata config for Next.js/Turbopack; it is MikroORM 7's recommended style.
- **Explicit entity list** (`lib/db/entities/index.ts`) instead of folder discovery – works inside the Next.js bundle.
- **Two configs:** `lib/db/config.ts` (app) and `mikro-orm.config.ts` (CLI, adds `Migrator`) – the migrator is not bundled into the app.
- **`serverExternalPackages`:** `@mikro-orm/sql`, `@mikro-orm/postgresql`, `kysely` – Next.js' built-in list only has `@mikro-orm/core` and the old `@mikro-orm/knex`.
- **Env loading:** `process.loadEnvFile` on the root `.env` (see spec for why not `@next/env`).
- **Next.js-managed AGENTS block** moved to `packages/app/AGENTS.md` – `next dev` now writes it there (the Next project dir), so the root copy was removed.
- **shadcn added `cn`** (official package from shadcn-ui, replaces clsx + tailwind-merge) – verified, kept.
- **shadcn set `--font-sans: var(--font-sans)`** (self-reference) – fixed back to `var(--font-geist-sans)`.

## Verification

- `npm run lint` – pass; `npm run typecheck` – pass; `npm run build` – pass (`/admin` partial prerender, `/api/health` dynamic).
- `npm run db:migrate` on a fresh DB → `user` table with unique email and role check constraint; `db:migration:check` → exit 0.
- `db:migration:check` with an un-migrated entity change → exit 1 (reverted).
- `npm run dev` → `/api/health` 200.
- `docker compose down -v && docker compose up --build` + `db:migrate`: `/` 200, `/admin` 200 with streamed "Database: connected", `/api/health` 200; with `db` stopped → 503 and "Database: unreachable"; after restart → 200.

## Open issues / handoff

- Migrations are not run automatically in Docker (manual `npm run db:migrate` from the host).
- `npm audit` dev-only findings from `eslint-config-next` remain (see earlier PRs).
- Next steps: Engineering Standards (lesson 2), then unit tests (Vitest) and integration tests (testcontainers) in CI.
