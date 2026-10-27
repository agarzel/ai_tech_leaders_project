# AI skills

Read this when you install, update, override or run a skill.

The Open Mercato skills (`om-*`, from [open-mercato/skills](https://github.com/open-mercato/skills)) are installed **per project**:

- `.agents/skills/` – the skill files (read by Codex and other agents); `.claude/skills/` – symlinks to them for Claude Code.
- `skills-lock.json` – pinned versions. Update with `npx skills update -p`; reinstall from the lock file with `npx skills experimental_install`.
- Do not edit installed skills. To adapt a skill to this project, create a skill with the same name in `.ai/skills/` – it overrides the matching parts of the generic one.
- Current overrides: `.ai/skills/om-code-review/` – DevMentor review rules R1–R5 (contract registry sync, actionable script errors, never destroy local state, real-run evidence, self-review disclosure).
- Run them as `/om-<name>` in Claude Code, `$om-<name>` in Codex.
- Also installed per project from [mattpocock/skills](https://github.com/mattpocock/skills): `grill-me` (`/grill-me`) and `grilling`.
- Installed per project from [pat-lewczuk/skills](https://github.com/pat-lewczuk/skills): `task-router` (routing of agent instructions; see `scripts/check-agents.mjs`).
