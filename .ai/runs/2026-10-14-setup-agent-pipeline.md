# Run: om-setup-agent-pipeline (lesson 3, step 2)

- **Date:** 2026-10-14
- **Agent:** Claude Code, skill `om-setup-agent-pipeline`
- **Branch:** `setup-agent-pipeline`

## Goal

Describe the project's SDLC for the `om-*` skills: `.ai/agentic.config.json`, tracker and browser descriptors, GitHub labels, and the process docs.

## Decisions (owner's answers)

- Tracker `github` (detected), browser `agent-browser` (already used by integration tests), base branch `auto` → `main`, specs `.ai/specs`.
- Validation gate = what CI runs: `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run test:integration` (needs Docker locally). The migrations check stays CI-only (needs a database).
- Full label taxonomy: 25 labels created; existing `bug` and `documentation` left untouched.
- QA gate on – the app has user-facing changes.
- Docs: `SDLC.md` (from the skill template, discovery blocks off), plus `CODE_REVIEW.md` and `BACKWARD_COMPATIBILITY.md` derived from this repo (engineering standards, existing routes, schema, exports, env, scripts). `AGENTS.md` existed, so it was not regenerated; a "Delivery process" section links the new docs.
- Pre-1.0 note in `BACKWARD_COMPATIBILITY.md`: breaking changes allowed when deliberate, labelled `risk-high` and all in-repo consumers are updated in the same PR.

## Verification

- Cross-skill coverage check against `.agents/skills`: `SKILL_COVERAGE_OK`.
- `gh label list`: 35 labels (10 GitHub defaults + 25 created).
- `.ai/agentic.config.json` validated with `jq`.
