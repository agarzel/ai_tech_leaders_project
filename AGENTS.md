# DevMentor – instructions for coding agents

DevMentor is a mentoring marketplace for developers (mentors, mentees, admins), built during the AI Tech Leaders course. See `README.md` for the product scope.

This is an npm-workspaces monorepo. Each package may have its own `AGENTS.md` with package-specific rules – read it before working inside that package (e.g. `packages/app/AGENTS.md` for the Next.js app).

## Stack

- Monorepo: npm workspaces, packages in `packages/`
- Next.js 16 (App Router, Cache Components enabled), React 19, TypeScript
- PostgreSQL 17 (via `docker compose`) with **MikroORM 7** (entities via `defineEntity`, migrations)
- **Awilix** – dependency injection container
- Tailwind CSS 4 for frontend pages, **shadcn/ui** (Base UI, `base-nova` style) for admin pages

These are fixed choices from the course (lesson 2). Do not introduce alternative libraries for these concerns (no Prisma/Drizzle/raw `pg`, no other DI container or UI kit).

UI language is English. Project documentation (`README.md`) is written in Polish.

## Repository layout

```
packages/
  app/              @devmentor/app – Next.js app, the main integration package (see its AGENTS.md)
.ai/                Metadata for AI-assisted work (see below)
.github/workflows/  CI
Dockerfile, docker-compose.yml
.env.example        Copy to .env – the single env file for the whole repo
```

Run npm commands from the repo root; root scripts delegate to the workspaces. Add dependencies to the package that uses them: `npm install <pkg> -w @devmentor/app`.

## The `.ai` folder – mandatory

All AI agents working in this repository MUST use these structures:

- `.ai/specs/` – specifications for spec-driven development (SDD).
  - File name: `YYYY-MM-DD-slug.md` (date the spec was created, short kebab-case slug).
  - Write or update a spec **before** implementing any non-trivial feature, and keep it in sync with what was built.
  - `.ai/specs/implemented/` – move a spec here once it is fully implemented and merged.
  - `.ai/specs/archive/` – move specs here that were abandoned or superseded.
- `.ai/runs/` – one log per autonomous AI run (implementing a feature, fixing a bug, refactoring).
  - File name: `YYYY-MM-DD-slug.md`.
  - Contents: goal, plan, decisions made and why, what was verified (commands + results), open issues, and a handoff section so another agent can resume if the run is interrupted.
- `.ai/lessons.md` – short, durable lessons learned (bugs found, gotchas, conventions discovered). Append an entry after fixing a bug, after a correction from the user, or whenever something is worth remembering long term.
  - `.ai/lessons/` – longer write-ups; link them from `lessons.md`.
  - Read `.ai/lessons.md` before starting work.

Use today's date in file names. Never delete specs, runs or lessons – move them instead.

## Commands

All from the repo root:

```bash
npm run dev                    # dev server on http://localhost:3000
npm run lint                   # ESLint (all workspaces)
npm run typecheck              # next typegen + tsc --noEmit (all workspaces)
npm run build                  # production build (output: standalone)
npm run db:migrate             # apply pending migrations
npm run db:migration:create    # generate a migration from entity changes
npm run db:migration:check     # fail if entities and migrations are out of sync
docker compose up -d db        # PostgreSQL only (for npm run dev)
docker compose up --build      # app + PostgreSQL in containers
```

## Workflow rules

- Work on a feature branch and open a pull request against `main`; never commit directly to `main`.
- Every PR must pass CI (lint, typecheck, build, database migrations, Docker image) before merge.
- Before finishing, run `npm run lint`, `npm run typecheck` and `npm run build` locally and report the results honestly.
- Plan before coding anything non-trivial; if the plan turns out wrong, stop and re-plan instead of pushing on.
- Prefer the simplest change that solves the problem; touch only what the task needs.
- Keep this file up to date: when you add a convention, command, folder or tool, document it here in the same PR.
