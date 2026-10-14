# Run: lesson 3 homework – project-specific om-code-review

- **Date:** 2026-10-14
- **Agent:** Claude Code
- **Branch:** `homework-code-review-override`

## Goal

Course lesson 3 homework: adapt an installed skill to DevMentor through the override mechanism (`.ai/skills/<skill-name>/SKILL.md`) and check how its behaviour changes.

## What was done

- `.ai/skills/om-code-review/SKILL.md` – an **extension** (imports the installed skill with `@`, never relaxes it) adding rules R1–R5, each derived from the real review of PR #14 or an incident during it:
  - R1 contract registry sync (`BACKWARD_COMPATIBILITY.md` updated with new scripts/env/exports/routes),
  - R2 repo scripts: Node built-ins only, actionable failure messages, no misdiagnosis, Windows `npm` spawn,
  - R3 never destroy a developer's local state (`docker compose down -v` etc.),
  - R4 real-run evidence for scripts and migrations,
  - R5 disclose self-review.
- `AGENTS.md` lists the override.

## Verification (demo, not committed)

A deliberately bad uncommitted change (`npm run db:reset` running `docker compose down -v`, importing undeclared `chalk`, no tests, no compat entry) was reviewed with `om-code-review`. Result: request changes – gate blocker (coverage 98.78%), [R3] blocker, [R2] major, [R1]/[R2]/[R4] minors, [R5] self-review notice. Without the extension the R1, R4 and R5 findings would not be raised and R3 would likely pass as the script's intent. The demo branch was deleted afterwards.
