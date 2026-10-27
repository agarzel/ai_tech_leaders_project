# The `.ai` folder – specs, runs, docs, lessons

Read this when you write a spec, a run log or a lesson. All AI agents working in this repository MUST use these structures.

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

Use today's date in file names. Never delete specs, runs or lessons – move them instead.
