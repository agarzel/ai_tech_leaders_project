# Run: AGENTS.md, CLAUDE.md and .ai structure

- **Date:** 2026-10-13
- **Agent:** Claude Code
- **Branch:** `add-agents-structure`

## Goal

Set up the repository context for coding agents (course lesson 2): `AGENTS.md` with project rules, `CLAUDE.md` that includes it, and the `.ai` folder with `specs/` (+ `implemented/`, `archive/`), `runs/`, `lessons.md` and `lessons/`.

## Decisions

- Kept the Next.js-managed block (`<!-- BEGIN/END:nextjs-agent-rules -->`) at the top of `AGENTS.md`; `next dev` re-creates it if removed. Project rules are appended below it.
- `CLAUDE.md` only contains `@AGENTS.md` so both Claude Code and other agents read one source of truth.
- `AGENTS.md` is written in English (agent-facing), consistent with the code; `README.md` stays in Polish.
- Empty folders are tracked with `.gitkeep`.
- Seeded `lessons.md` with real findings from earlier PRs (#3, #4).
- The stack section records the planned lesson-2 libraries (MikroORM, Awilix, shadcn/ui, monorepo) so agents don't pick alternatives; they are not installed yet.

## Verification

- `npm run lint` – pass
- `npm run typecheck` – pass
- `npm run build` – pass
- CI on the PR – see checks

## Handoff / next steps

1. Add the rest of the lesson-2 stack: monorepo, MikroORM with first migration (replacing `lib/db.ts`), Awilix, shadcn/ui.
2. Engineering Standards in `AGENTS.md`.
3. Unit tests (Vitest) and integration tests (testcontainers) in CI.
