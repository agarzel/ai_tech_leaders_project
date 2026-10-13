<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DevMentor – instructions for coding agents

DevMentor is a mentoring marketplace for developers (mentors, mentees, admins), built during the AI Tech Leaders course. See `README.md` for the product scope.

## Stack

- Next.js 16 (App Router, Cache Components enabled), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL 17 (via `docker compose`); currently accessed through a plain `pg` pool in `lib/db.ts`
- Planned (course lesson 2): MikroORM with migrations, Awilix for dependency injection, shadcn/ui for admin pages, monorepo with a `packages/` folder. Do not introduce alternative libraries for these concerns.

UI language is English. Project documentation (`README.md`) is written in Polish.

## Repository layout

```
app/              Next.js App Router (pages, layouts, route handlers)
lib/              Shared server code (e.g. db.ts)
public/           Static assets
.ai/              Metadata for AI-assisted work (see below)
.github/workflows CI
Dockerfile, docker-compose.yml, .env.example
```

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

```bash
npm run dev          # dev server on http://localhost:3000
npm run lint         # ESLint
npm run typecheck    # next typegen + tsc --noEmit
npm run build        # production build (output: standalone)
docker compose up -d db        # PostgreSQL only (for npm run dev)
docker compose up --build      # app + PostgreSQL in containers
```

`GET /api/health` checks the database connection (200 ok / 503 unreachable).

## Workflow rules

- Work on a feature branch and open a pull request against `main`; never commit directly to `main`.
- Every PR must pass CI (lint, typecheck, build, Docker image) before merge.
- Before finishing, run `npm run lint`, `npm run typecheck` and `npm run build` locally and report the results honestly.
- Plan before coding anything non-trivial; if the plan turns out wrong, stop and re-plan instead of pushing on.
- Prefer the simplest change that solves the problem; touch only what the task needs.
- Keep this file up to date: when you add a convention, command, folder or tool, document it here in the same PR.
