# The `.ai` folder – specs, runs, docs, lessons, audits

Read this when you write a spec, a run log, a lesson or a knowledge audit. All AI agents working in this repository MUST use these structures.

- `.ai/specs/` – specifications for spec-driven development (SDD).
  - File name: `YYYY-MM-DD-slug.md` (date the spec was created, short kebab-case slug).
  - Write or update a spec **before** implementing any non-trivial feature, and keep it in sync with what was built.
  - `.ai/specs/implemented/` – move a spec here once it is fully implemented and merged.
  - `.ai/specs/archive/` – move specs here that were abandoned or superseded.
- `.ai/runs/` – one log per autonomous AI run (implementing a feature, fixing a bug, refactoring).
  - File name: `YYYY-MM-DD-slug.md`.
  - Contents: goal, plan, decisions made and why, what was verified (commands + results), open issues, and a handoff section so another agent can resume if the run is interrupted.
- `.ai/docs/` – long-lived project documentation (e.g. `engineering-standards.md`, `architecture.md`, `testing.md`).
- `.ai/skills/` – project-specific overrides of installed skills (same name as the skill they adapt); see `.ai/docs/ai-skills.md`.
- `.ai/lessons.md` – short, durable lessons learned (bugs found, gotchas, conventions discovered). Append an entry after fixing a bug, after a correction from the user, or whenever something is worth remembering long term.
  - `.ai/lessons/` – longer write-ups; link them from `lessons.md`.
- `.ai/maintenance/` – dated knowledge audits (`YYYY-MM-DD-audit.md`): spec status against the code, contradictions between documents and code with stable ids (S-*, C-*, N-*), and decisions for the team. Each audit compares itself with the previous one by id. Written by the `weekly-maintenance` workflow.
- `.ai/cezar/workflows/` – versioned workflow definitions for the cezar cockpit (e.g. `weekly-maintenance.yaml`); the rest of `.ai/cezar/` (task worktrees, runs, state) is gitignored.
- `.ai/qa/` – QA scenarios and evidence per area (e.g. `SECURITY/`, `BOOKINGS/`, `SESSION/`) and the QA knowledge base.

Use today's date in file names. Never delete specs, runs or lessons – move them instead.
