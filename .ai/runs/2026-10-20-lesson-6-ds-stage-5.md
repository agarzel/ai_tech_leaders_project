# Run: lesson 6, design system stage 5 (2026-10-20)

Branch `lesson-6-ds-stage-5`. Not committed, not pushed.

## Goal
Fix issue #40 (home page), extend `lint:tokens` (D-S3), generate the component table (D-S4), add CI jobs (S7), sync the validation gate.

## Plan and decisions
1. Home page: `PageLayout` + `AppHeader`, brief copy, no CTA until `/mentors` exists (a link to a 404 is worse than none; conservative, reversible).
2. `check-tokens.mjs`: new rules + per-rule `ALLOWED` map with reasons; bare `shadow` is flagged only on lines that look like class lists (prose says "no shadow"); `to-do` is not a gradient stop.
3. `design-system-doc.mjs`: strips TypeScript types with `node:module.stripTypeScriptTypes` (Node 22.13+), imports the data, rewrites the marked section; `--check` for CI.
4. CI: two jobs added before `docker`; gate synced in `.ai/agentic.config.json`, `SDLC.md`, `AGENTS.md`.

## Verified
lint, typecheck, test:coverage (427 tests, 100%), build, build-storybook, test:storybook (1096), lint:tokens (0), docs:design-system:check, test:integration (11): all green locally.

## Open issues
Agent test (new session). CI jobs not yet run on GitHub. `stripTypeScriptTypes` is experimental in Node 22 (warning suppressed in npm scripts).

## Handoff
Review the diff, commit on this branch, open a PR (closes #40), watch the two new CI jobs.
