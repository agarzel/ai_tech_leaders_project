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

## Stage 2, part 1 and batch 1 (2026-10-19)

Goal: list how shape, density and states differ from base-nova (B1–B25, questions 2.1–2.5), then after the owner's decisions build batch 1: Button, Input, Textarea, NativeSelect, Label, Field, plus B23–B25.

Owner decisions: 2.1 `sm` 28 px only in dense rows (40 px on touch); 2.2 round radio and switch; 2.3 12 px padding; 2.4 hints muted-foreground, errors destructive + icon + instruction; 2.5 "(optional)", no asterisks; B1–B25 accepted (B14 contrast computed first: 13.92 / 9.85; B16 follows F3).

Done: see `packages/ui/POSTEP.md` → "Etap 2 – partia 1, wynik".

Decisions and why:
- `npm install -w @devmentor/ui shadcn@^4.21.4` resolved to 4.22.1 and changed the lockfile; I restored my own pre-install copy of the lockfile and wrote the ranges into `package.json` by hand, then `npm install` – B23 promised no new versions.
- Field trimmed to what batch 1 documents (rule 6); the rest comes back in batch 2.
- Frozen hover/focus/active: Storybook-only `@custom-variant` overrides, so the matrix uses the component's own declarations.
- ESLint rule instead of a review note for `cn`, because every CLI add regenerates the wrong import.

Verified: lint OK, typecheck OK, test:coverage OK (169, 100%), build OK, build-storybook OK, test:storybook OK (84/84, both themes), lint:tokens FAIL with 6 remaining values in card/alert/badge (batch 3). No `git stash`; nothing committed.

Open issues: first cold-cache story run reloaded Vite (fixed with `optimizeDeps.include`, not re-verified on a clean cache); integration tests not run.

Handoff: after "dalej" → batch 2 (Checkbox, RadioGroup, Switch, InputGroup, Kbd, Separator), see "Następny krok" in POSTEP.md.
