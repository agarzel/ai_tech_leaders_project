# DevMentor – instructions for coding agents

DevMentor is a mentoring marketplace for developers (mentors, mentees, admins), built during the AI Tech Leaders course. See `README.md` for the product scope.

This is an npm-workspaces monorepo. Read only what your task needs: the table in "Where to read" names the files. Each package has its own `AGENTS.md` with package-specific rules.

## Stack

- Monorepo: npm workspaces – `app`, `core`, `db`, `ui` in `packages/`
- Next.js 16 (App Router, Cache Components enabled), React 19, TypeScript
- PostgreSQL 17 (via `docker compose`) with **MikroORM 7** (entities via `defineEntity`, migrations)
- **Awilix** – dependency injection container
- Tailwind CSS 4 and **shadcn/ui** (Base UI, `base-nova` style) for every page – public, mentee, mentor and admin – through the DevMentor design system in `@devmentor/ui` (tokens, components, Storybook)

These are fixed choices from the course (lesson 2). Do not introduce alternative libraries for these concerns (no Prisma/Drizzle/raw `pg`, no other DI container or UI kit).

UI language and all project documentation (`README.md`, `AGENTS.md`, `.ai/`) are in English.

## Monorepo layout

```
packages/
  app/    @devmentor/app  – Next.js: HTTP (route handlers) and pages, src/app/
  core/   @devmentor/core – business logic: Awilix container + cradle, services, http layer, validators, env, logger
  db/     @devmentor/db   – MikroORM: config, entities, migrations
  ui/     @devmentor/ui   – presentation and design system: tokens (src/styles/), shadcn/ui primitives, backend/ panel building blocks, Storybook (.storybook/, stories/)
.ai/                      Metadata for AI-assisted work (see below)
.github/workflows/        CI
Dockerfile, docker-compose.yml
.env.example              Copy to .env – the single env file for the whole repo
scripts/                  Repo scripts in plain Node (no dependencies), e.g. setup.mjs, check-tokens.mjs – unit-tested like the packages
tsconfig.base.json        Shared TypeScript options
eslint.config.mjs         Lint rules for all packages, incl. dependency boundaries
```

**Dependency direction (enforced by ESLint `no-restricted-imports`):** `app → core → db`; `ui` is importable by `app` only. Only `db` imports `@mikro-orm/*` (others use its type re-exports); `core` never imports `next`/`react`; `app` never imports `db` directly. Do not loosen these rules for convenience.

Internal packages are consumed as TypeScript source (`exports` → `src/`, compiled by Next.js via `transpilePackages`). Run npm commands from the repo root; root scripts delegate to the workspaces.

## Hard rules

- Work on a feature branch and open a pull request against `main`; never commit directly to `main`.
- Every change is 100% covered by unit tests for `core`, `db`, `ui` and `scripts`. CI fails below 100%; never lower the thresholds, add `/* v8 ignore */` or widen the coverage exclude list.
- Add a dependency to the package that uses it: `npm install <pkg> -w @devmentor/<name>`.
- The validation gate in `.ai/agentic.config.json` and in `SDLC.md` stays in sync with CI; change them together.
- Never delete specs, runs or lessons; move them instead.
- Do not edit installed skills; project overrides go to `.ai/skills/`.
- Before finishing, run `npm run lint`, `npm run typecheck`, `npm run test:coverage` and `npm run build` and report the results honestly.

## Commands

All from the repo root:

```bash
npm run setup                  # idempotent local setup: deps, .env, PostgreSQL, migrations (scripts/setup.mjs)
npm run dev                    # dev server on http://localhost:3000
npm run lint                   # ESLint (all packages, incl. dependency boundaries)
npm run typecheck              # next typegen + tsc --noEmit (all workspaces)
npm run build                  # production build (output: standalone)
npm test                       # unit tests (Vitest, all packages)
npm run test:coverage          # unit tests + 100% coverage gate (what CI runs)
npm run test:watch             # watch mode
npm run test:integration       # integration tests (needs Docker; first run: npm run test:integration:setup)
npm run storybook              # design-system Storybook on http://localhost:6006
npm run build-storybook        # static Storybook build (packages/ui/storybook-static)
npm run test:storybook         # every story as a browser test, both themes, a11y errors fail (first run: npx playwright install chromium)
npm run lint:tokens            # design tokens: no colour literals or palette classes outside the token layer (rules in scripts/check-tokens.mjs)
npm run docs:design-system     # regenerate the component tables in .ai/docs/design-system.md from packages/ui/.storybook/blocks/components-data.ts
npm run docs:design-system:check  # fail when those tables are stale (CI "Design tokens" job)
npm run check:agents           # fail when AGENTS.md files exceed their budget, a routed path is missing or a CLAUDE.md is not just the import
npm run db:migrate             # apply pending migrations
npm run db:migration:create    # generate a migration from entity changes
npm run db:migration:check     # fail if entities and migrations are out of sync
npm run db:seed                # idempotent demo accounts (admin@, mentor@, mentee@devmentor.test; no passwords – use auth:set-password)
npm run auth:set-password -- --email you@example.com --admin   # set/reset a password; run once after `npm run setup`; password from DEVMENTOR_PASSWORD (`read -rs DEVMENTOR_PASSWORD && export DEVMENTOR_PASSWORD`), never an argument
npm run db:up                  # PostgreSQL only (docker compose up -d db), for npm run dev
npm run db:down                # stop the compose stack (docker compose down)
docker compose up --build      # app + PostgreSQL in containers
```

## Where to read

| Task | Read |
|---|---|
| Any task, first | `.ai/lessons.md` |
| Bug fix | `.ai/docs/engineering-standards.md`, `.ai/docs/testing.md` |
| New feature | `.ai/specs/` (write the spec first), `.ai/docs/architecture.md`, `.ai/docs/engineering-standards.md` |
| Refactor | `.ai/docs/architecture.md`, `.ai/docs/engineering-standards.md` |
| Review | `CODE_REVIEW.md`, `BACKWARD_COMPATIBILITY.md` |
| Writing unit tests | `.ai/docs/testing.md` |
| Naming | `.ai/docs/engineering-standards.md` (naming table) |
| Domain code, shared API and UI layers | `.ai/docs/architecture.md` |
| Services, validators, Awilix container | `packages/core/AGENTS.md` |
| Entities, migrations | `packages/db/AGENTS.md`, `BACKWARD_COMPATIBILITY.md` |
| Next.js routes, pages, route handlers | `packages/app/AGENTS.md` |
| Integration tests | `packages/app/AGENTS.md` (section "Integration tests") |
| Any screen or UI component | `.ai/docs/design-system.md`, `packages/ui/AGENTS.md` |
| Storybook story tests | `packages/ui/AGENTS.md` |
| Tickets, PRs, QA, labels | `SDLC.md` |
| Specs, runs, lessons | `.ai/docs/ai-folder.md` |
| AI skills: install, update, override | `.ai/docs/ai-skills.md` |
| Editing any `AGENTS.md` | Commands section, npm run check:agents (routes exist, root ≤ 150 lines, unit ≤ 120) |
