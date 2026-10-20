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

## Addendum: agent test gaps closed (branch `lesson-6-agent-test-gaps`)

Source: `lekcja-06/test-agentem.md` (screen "Cancel booking", 57 decisions, 18 guesses). Owner approved all section B rules on 2026-10-20. Documentation only.

- New pattern pages `Patterns/Action result` (B1) and `Patterns/Page-level destructive action` (B2); linked from Start here and `.ai/docs/design-system.md`.
- B8-B12 in How to choose, Content, Delete confirmation; B13 in the Deadline pattern + AcceptDeadline note (no code change); B15 in AlertDialog; B18 in Alert and Usage and accessibility; B19-B20 in `packages/ui/AGENTS.md`, Contributing, Usage and accessibility.
- Short forms mirrored in `.ai/docs/design-system.md` (outside the generated table markers; `components-data.ts` untouched).
- Section A gaps 3-7, 14, 16, 17 added to What is missing ("Input for the E03 specification"); #34 status unified as "Not built – no E03 spec".
- Decision: rule 15 contradicts the current component (action on top at 320 px). Followed the owner's rule in the docs and listed the component change as open work.
- Verified: see the final report of this run (lint, typecheck, test:coverage, build-storybook, test:storybook, lint:tokens, docs:design-system:check).

Handoff: commit on this branch; the two open code items (generic deadline, AlertDialog order) belong to E03 / a follow-up.
