# Run: lesson 6 – design system and Storybook

- Date: 2026-10-19
- Branch: `lesson-6-design-system`
- Spec: `.ai/specs/2026-10-19-design-system-storybook.md`
- Working log (Polish, stage by stage): `packages/ui/POSTEP.md`

## Goal

Build the DevMentor design system in `@devmentor/ui` with Storybook documentation, in stages 0–5 of `lekcja-06/prompt-storybook.md`. Stop after each stage for the owner's approval.

## Plan

See the spec ("Scope by stage") and `POSTEP.md` ("Plan").

## Decisions

The owner decided S1–S21 and P1–P5 on 2026-10-19; they are recorded in the spec. Notable ones:
- E03 is rejected (no spec).
- Stories go in `packages/ui/stories/` so the coverage exclude list stays unchanged.
- The CI job is deferred to stage 5.

## Verified

- Stage 0: repo inventory (versions read from `node_modules`, registry via `npm view`, shadcn registry via `npx shadcn view`). `sonner` depends on `next-themes`.
- Stage 1: nothing installed yet. `@vitest/browser-playwright` 5.0.5 requires vitest 5.0.5 exactly, so 5.0.4 is pinned to match the repo.

## Open issues

- The owner must approve the package list before `npm install` (in `POSTEP.md`).
- The app home page violates A01/A02 and is out of scope (S9).

## Handoff

Resume from "Następny krok" in `packages/ui/POSTEP.md`.

## Stage 1 (2026-10-19)

Built:
- tokens and theme in `packages/ui/src/styles/`, wired into the app's `globals.css`;
- `cn` configured;
- Storybook 10.6.2 config with a theme switch on `<html>`;
- Foundations pages and stories;
- story tests in two themes;
- `scripts/check-tokens.mjs` with tests;
- root scripts;
- doc updates.

Full list in `packages/ui/POSTEP.md` ("Etap 1 – wynik").

Verified:
- `npm run lint` passed;
- `npm run typecheck` passed;
- `npm run test:coverage` passed (169 tests, 100%);
- `npm run build` passed;
- `npm run build-storybook` passed;
- `npm run test:storybook` failed: 18/20, Contrast Dark fails on the dark destructive tint, which is a real finding (F1);
- `npm run lint:tokens` failed: 17 arbitrary values in the existing shadcn primitives, which is stage 2 work.

Decisions and why:
- Packages were installed one at a time, because the single command crashed npm (ERESOLVE, then the arborist `edgesOut` error).
- `react-dom` was added as a peer of ui.
- Versions are pinned exactly, because `@vitest/browser-playwright` needs vitest 5.0.4 exactly.
- Typography roles use the `type-` prefix so `cn` never treats them as colours.
- The contrast table paints the foreground over the background, so translucent tokens (the dark `--border`) are composited.

Incident:
- While checking the audit, a stray `git stash` stashed the tracked changes.
- They were restored immediately with `git stash pop`, which applied cleanly.
- Untracked files were never touched.

Open issues: F1–F6 in `POSTEP.md`. The CI job is deferred to stage 5 (S7).

Handoff: next is stage 2, after the owner's "dalej" and the F1–F6 decisions.

## Owner decisions after stage 1 (2026-10-19)

- F1 accepted and applied: the dark `--destructive` is red-300. Contrast was recalculated for every affected pair (`tokens.css` comment, `lekcja-06/tokeny.md`, the Color page). `test:storybook` now passes 20/20 in both themes.
- F2 accepted.
- F3 accepted as proposals (P5).
- F4 and F5 accepted for stage 2.
- F6 will be decided on the Content page.
- Rule: never run `git stash` (review rule R3: never destroy local state). The incident above must not repeat; use read-only commands such as `git show HEAD:<file>` to compare against the last commit.
