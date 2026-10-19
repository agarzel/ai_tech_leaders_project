# Design system and Storybook

- Date: 2026-10-19
- Owner: Arkadiusz
- Task: `lekcja-06/prompt-storybook.md` (lesson 6, exercise 3); progress in `packages/ui/POSTEP.md`
- Sources: `lekcja-06/referencje.md` (R01.x, R02.x, A01–A05, K1–K4, P1–P21), `lekcja-06/tokeny.md` (T1–T16, accent), `.ai/specs/product-brief.md`, `.ai/specs/backlog.md`, `.ai/specs/2026-10-19-mentor-accounts-and-offer.md`, `.ai/specs/2026-10-19-booking-and-prepayment.md`

## TLDR

Build the DevMentor design system in `@devmentor/ui` and document it in Storybook as a usage manual for developers, AI agents and designers. Tokens come from `tokeny.md`, style from `referencje.md`. Components are the existing shadcn base-nova primitives (Base UI, `render` prop, not `asChild`), adapted to the tokens. Covers epics E01 (mentor offer) and E02 (booking and prepayment). E03 has no spec and is listed only under "What is missing".

## Scope by stage

0. Inventory and plan (done 2026-10-19).
1. Foundations: Storybook setup, three-layer tokens (raw, semantic, component) for light and dark, Tailwind wiring, self-hosted fonts, root theme switch, Foundations pages, token checker script.
2. Primitives: shadcn primitives added via CLI, then adapted to tokens. Each gets a 13-section docs page and a state matrix.
3. Product components (E01, E02), patterns, full-screen screen stories with state maps.
4. Teaching pages (Start here, Components, How to choose, Usage and accessibility, Content, What to avoid, What is missing, Contributing, one page per epic) and the agent file `.ai/docs/design-system.md`.
5. Verification and report, plus the deferred CI job.

## Decisions (owner, 2026-10-19)

| Id | Decision | Source |
|---|---|---|
| S1 | Tokens live in `packages/ui/src/styles/` (`tokens.css` with raw, semantic and component layers for `:root` and `.dark`; `theme.css` with the `@theme inline` mapping). New additive export `./styles/*`. `packages/app/src/app/globals.css` imports them instead of defining values. `components.json` `tailwind.css` points to the ui file. Direction app → ui is unchanged. | owner; AGENTS.md dependency rules |
| S2 | Storybook 10.6.2 with `@storybook/react-vite`, configured by hand in `packages/ui/.storybook` (no `storybook init`). | owner |
| S3 | Addons: docs + `remark-gfm`, a11y (`a11y: { test: 'error' }`), vitest (browser mode, Playwright Chromium). Own theme switch that sets the class on `<html>`. MSW only in stage 3, after separate approval. | owner; prompt rules 8, 9 |
| S4 | Geist and Geist Mono from `@fontsource-variable/*` in ui for Storybook. The app keeps `next/font`. | owner; P2 |
| S5 | Stories live in `packages/ui/stories/`, outside the `packages/ui/src/**` coverage glob. The coverage `exclude` list is not widened. Story tests run in their own Vitest config through `test:storybook`, outside `test:coverage`. | owner; AGENTS.md testing rules |
| S6 | Root scripts `storybook`, `build-storybook`, `test:storybook` (light and dark), `lint:tokens` delegate to `@devmentor/ui`. The token checker is plain Node in `scripts/check-tokens.mjs` with 100% unit coverage. These are additive contracts, documented in `AGENTS.md` and `BACKWARD_COMPATIBILITY.md`. | owner |
| S7 | A CI job "Storybook" (build, story tests, token check) plus the validation gate and `SDLC.md` sync. **Deferred to stage 5.** | owner |
| S8 | Primitives are added via the shadcn CLI and then adapted to tokens, never written from scratch. `packages/ui/AGENTS.md` is clarified. `components/ui/**` stays excluded from coverage; play functions test their behaviour. | owner |
| S9 | The token checker scans `packages/ui/src`, `packages/ui/stories` and `packages/ui/.storybook`. The app home page (`page.tsx`: slate/cyan, A01/A02) is listed in "What is missing", not changed here. | owner; prompt rule 11 |
| S10 | No toast in 1.0. Copy confirmations are inline with `aria-live`. | owner; specs have no toast need |
| S11 | Dense list row = shadcn `item` (R01.1, T9, T12). Empty state = the existing `EmptyState`. | owner |
| S12 | Select = the existing `native-select`. No Base UI `select` or `combobox` until a need appears. | owner |
| S13 | Rejected: no E03 components or screens. E03 (#33–#36) appears only in "What is missing". | owner; no spec |
| S14 | No page for E04 (parked); listed in "What is missing". | owner |
| S15 | This spec and a run log; `POSTEP.md` is the working log, in Polish. Documentation is in English. | owner; AGENTS.md `.ai` rules |
| S16 | The theme switch exists in Storybook only; the app gets no switch for now. | owner; T15; P1 |
| S17 | Semantic spacing as Tailwind utilities through `@theme` (e.g. `gap-in-group`, `p-panel`, `py-list-row`). In stage 1, verify that `cn` merges them correctly. | owner; T8, T9 |
| S18 | Storybook UI shows only "DevMentor"; telemetry and what's-new notifications are off; no onboarding addon. The base library's origin is recorded in a technical note. | owner; prompt rule 10 |
| S19 | The agent summary lives in `.ai/docs/design-system.md`, linked from `AGENTS.md` and `packages/ui/AGENTS.md`. | owner; repo convention |
| S20 | The design system covers every persona's pages. The "Tailwind for frontend, shadcn for admin" line in `AGENTS.md` and the UI/UX section of the E01 spec are updated. | owner |
| S21 | "DataTable for every list" is narrowed to tabular (admin) lists. Product lists use the dense `item` list. | owner; R01.1 |
| P1 | Dark is a product theme in Storybook and in a11y tests. | owner; T15 |
| P2 | Geist + Geist Mono. Type roles: page title text-2xl/600, section text-lg/600, body and label text-sm (label 500), meta text-xs, numbers `tabular-nums`, code mono text-sm. | owner; R01.2, T12 |
| P4 | Control height: 32 px on desktop, 40 px on `pointer: coarse`. | owner; R01.1 |
| P5 | Motion and tone are proposed later, marked as proposals. | owner; gaps in `referencje.md` |

## Out of scope

App code outside the design system, except wiring scripts and config (`globals.css` import, `components.json`, root scripts). No remote push or publishing. E03, E04, toast, MSW until stage 3.

## Done when

The prompt's "Kiedy design system jest gotowy" list is met, `lint`, `typecheck`, `test:coverage`, `build`, `build-storybook`, `test:storybook` (both themes) and `lint:tokens` pass, and the agent test is prepared in `POSTEP.md`.
