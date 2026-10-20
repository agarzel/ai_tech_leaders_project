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

## Stage 2, batch 2 (2026-10-19)

Goal: Checkbox, RadioGroup, Switch, InputGroup, Kbd, Separator; restore FieldSet, FieldLegend, FieldContent, horizontal Field. Batch 1 was committed by the coordinator (1710f15) after test:integration 11/11.

Decisions: new proposals B26–B33 (see POSTEP.md), each implemented in its most conservative reversible form; B31 (36 px button inside an input group on touch, below P4's 40 px) flagged for confirmation.

Verified: lint OK, typecheck OK, test:coverage OK (169, 100%), build OK, build-storybook OK (12 primitive docs pages checked in Chromium), test:storybook OK (148/148, both themes), lint:tokens FAIL with the same 6 values (card/alert/badge, batch 3). CLI: no overwrites, package.json and lockfile unchanged. No `git stash`; nothing committed.

Bugs found: an `id` with a space broke the checkbox label; `cn` dropped `font-sans` placed before `type-meta`.

Handoff: owner decisions on B26–B33, then batch 3 (Card, Badge, Alert, Avatar, Item, text link) – see "Następny krok" in POSTEP.md.

Owner decisions on batch 2: B26–B30, B32, B33 accepted; B31 replaced by the alternative – on coarse pointers an InputGroup holding an inline button grows to 48 px so the button keeps 40 px (P4). Applied and re-verified: lint OK, typecheck OK, test:coverage OK (169, 100%), build-storybook OK (rule present in the built CSS), test:storybook 148/148 in both themes.

## Stage 2, batch 3 (2026-10-19)

Goal: Card, Badge, Alert, Avatar, Item, in-content link; B20/B21 so `lint:tokens` reaches zero. Batch 2 committed by the coordinator (661d3c7); B31 replaced by the 48 px group alternative.

Decisions: proposals B34–B46 in POSTEP.md (B41 not applied – base kept). Avatar fallback (B44): neutral initials in muted-foreground on muted for everyone, a neutral person icon without a name, never a per-person colour.

Verified: lint OK, typecheck OK, test:coverage OK (170, 100%), build OK, build-storybook OK, test:storybook OK (214/214, both themes), lint:tokens OK (0 findings, 87 files). CLI: no overwrites, package.json and lockfile unchanged. No `git stash`; nothing committed.

Found on the way: `lint:tokens` also scans comments (three comments reworded); the base `ItemGroup role="list"` had no `listitem` children – `Item` now has `role="listitem"`.

Handoff: owner decisions on B34–B46, then batch 4 (Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs).

## Stage 2, batch 4 (2026-10-19)

Goal: Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Tabs. Batch 3 committed by the coordinator (5b1ea6c, lint:tokens 0, test:integration 11/11). A separate read-only audit agent was running the dev server on port 3000 concurrently (left untouched); `lekcja-06/audyt-aplikacji.md` appeared from it, not from this run.

Decisions: proposals B47–B59 in POSTEP.md, each in a conservative reversible form (new `--overlay` token without blur; fade/zoom-only motion; one dialog width; AlertDialog without media/size; dropdown menu items ≥28px/40px touch; no submenus/checkbox/radio items; tooltip without an arrow, default 600ms delay; tabs in one line style, manual activation).

Verified: lint OK, typecheck OK, test:coverage OK (170, 100%), build OK, build-storybook OK (8 new docs pages checked for 13 sections and valid tables), test:storybook OK (272/272, both themes, after fixing one flaky Tabs test). lint:tokens OK (0 findings, 105 files). CLI: no overwrites (button.tsx), package.json and lockfile unchanged. No `git stash`; nothing committed.

Rule 9 (overlay theme from `<html>`) verified explicitly in a headless browser: dropdown/popover popups take the dark `--card`/`--popover` colour when `<html>` carries `.dark`; tooltip's inverted colours are by design.

Bugs found and fixed: Field's invalid-state colour was applied to the whole container instead of just the label/error (fixed with a scoped selector); a flaky Tabs interaction test (Base UI keeps the outgoing panel `inert` in the DOM during its exit transition — test now filters `[inert]` and waits); a Dialog story used `"x".repeat(290)` as decline-reason text — replaced with a realistic sentence (prompt rule 7, no invented filler data).

Handoff: owner decisions on B47–B59, then batch 5 (Skeleton, Spinner, Table — adapting existing primitives — and a review of the `backend/` blocks), which closes the stage-2 minimal set.

## Stage 2, batch 5 — last of stage 2 (2026-10-19)

Goal: Skeleton (new), adapt the existing Spinner and Table to tokens, review the backend/ blocks (CrudForm, DataTable, feedback) that consume them; add a Storybook favicon. Batch 4 committed by the coordinator (0c7e0a1), B47–B59 approved as proposed.

Decisions: proposals B60–B62 (Skeleton respects reduced motion; Table gets list-row padding and a consistent full bg-muted instead of /50 tints). Favicon done directly per the owner's explicit, open-ended request (not a B-proposal): a minimal teal "D" mark on a stone-950 square, using the exact raw token hex values, no gradients/glow/sparkles; linked via `.storybook/public/favicon.svg`, `staticDirs` in main.ts, `<link rel="icon">` in manager-head.html (kept the existing title-fix script).

Backend/ review: started a temporary `next dev` on port 3101 (separate from the coordinator's own port-3000 server, which was left untouched and stopped afterward), exercised `/admin` and `/admin/users` against the running database, created rows through `CrudForm` and viewed them in `DataTable`. Everything renders correctly with the restyled primitives — no regressions. Noted but not changed (out of this batch's scope): `CrudForm` still hand-builds fields instead of using the `Field`/`FieldLabel`/`FieldError` parts from batch 1 (works, just not aligned to the newer pattern); `CrudForm`/`EmptyState` use plain Tailwind spacing (`space-y-4`, `gap-2`) instead of the semantic `gap-*` utilities (visually identical, same scale values, just not using the named vocabulary). Neither trips `lint:tokens`. Could not verify dark mode in the app itself — it has no theme toggle (known gap, S16); forcing the `dark` class via an init script did not survive Next.js hydration.

Verified: lint OK, typecheck OK, test:coverage OK (170, 100%, including the 50 pre-existing backend/ unit tests passing unchanged), build OK, build-storybook OK (3 new docs pages, 13 sections each, favicon present in the built output), test:storybook OK (304/304, both themes), lint:tokens OK (0 findings, 112 files). CLI: no overwrites, package.json and lockfile unchanged. No `git stash`; nothing committed.

This closes the minimal primitive set from stage 0/2.

Handoff: owner decisions on B60–B62, then stage 3 (product components, patterns, screens for epics E01/E02) — see "Następny krok" in POSTEP.md.

## Stage 3 — plan (2026-10-19)

Goal: plan product components, patterns, screens and batches for E01/E02 without code. Wrote "Etap 3 – plan" in `packages/ui/POSTEP.md` (26 product components with props from spec DTOs and data states, 7 generic blocks, 11 patterns, 14 screens with state maps, 6 batches, MSW plan, known-debt placement, proposals C1–C17, questions Q1–Q5). Owner decisions: Q1 yes (msw 3.0.3 + addon 3.0.3), Q2 count in a sentence allowed, Q3 accent on Accept of the nearest deadline on /mentor/bookings and none on /m/[slug], Q4 keep the E01 /m/[slug] variant, Q5 plain text (monospace code blocks → What is missing), C1–C17 accepted.

## Stage 3, batch 1 (2026-10-19)

Goal: MSW install + wiring, `lib/format`, `lib/time`, CrudForm on Field, DataTable/Pagination and feedback blocks on tokens, ErrorMessage without raw `error.message`, the Form pattern.

Decisions: proposals C18–C28 in POSTEP.md (error descriptions for technical codes, explicit `optional`, blur validation for changed fields, autocomplete defaults, pagination as metadata, "Primitives/Panel blocks" menu group, `errorTitle`, EmptyState/LoadingMessage spacing tokens, spinner in the submit button, focusable form-level error, docs pages link to play-driven stories instead of showing initial states).

Install deviation: npm 10.9.2 crashes (`edgesOut` in arborist `#loadPeerSet`) on the approved command, on each package alone and on the 3.0.2 fallback. A `--legacy-peer-deps` attempt dropped vite/typescript/rolldown from the lockfile and was fully reverted from a pre-install copy (no git stash; `cmp` confirmed the restore). Final route: the same install with `npx npm@11 --package-lock-only` on a scratch copy of the manifests and lockfile, diff reviewed (33 new msw-tree entries, no version changes, nothing removed), copied in, `npm install` with npm 10. Result: +2 lines in ui package.json, lockfile +453/−0. `npm audit` unchanged (10 pre-existing high). msw 3 / addon 3 APIs differ from the plan (`mswLoader` from `msw-storybook-addon/csf3`; `onUnhandledFrame` instead of `onUnhandledRequest`) – preview uses its own setup.

Verified: lint OK, typecheck OK, test:coverage OK (213, 100%), build OK, build-storybook OK (7 new docs pages checked in Chromium: 13 sections on block pages, tables render, no page errors; MSW answers in the built Storybook), test:storybook OK (382/382, both themes, +39 stories, +16 interaction tests), lint:tokens OK (0, 133 files), test:integration OK (11/11). Live app on a temporary `next dev -p 3102` (stopped, build dir removed): CrudForm/DataTable/Pagination render and behave as designed at 1440 and 320 px; test users created in the local dev DB.

Finding outside the design system: on that dev server a duplicate email in `POST /api/users` returns 500 (`ConflictError` logged as unhandled), reproducible with curl; the integration suite's fresh server returns 409 for the same case. Suspected duplicate `AppError` class across Turbopack chunks (related to #16) – not investigated further, not changed; listed for a separate issue.

Bug fixed on the way: `{things}` in MDX prose broke the LoadingMessage docs page (caught by the built-page check).

Nothing committed. No `git stash`.

Handoff: owner decisions on C18–C28, then batch 2 (E01 shell, auth, admin) per POSTEP.md 3.4.

## Stage 3, batch 2 (2026-10-19)

Goal: E01 shell (AppHeader + RoleNav, PageLayout, AccountMenu), sign-in and registration screens (login, register, register/mentor with invitation states), admin invitations (InvitationLinkPanel with CopyField, InvitationStatusBadge), admin home without the card grid, pattern "Link shown once", E01 screen state map. Batch 1 committed by the coordinator (91e24b6), C18–C28 accepted; the dev-server 409→500 finding was moved to #16 (fresh server returns 409).

Decisions: proposals C29–C40 in POSTEP.md (renderLink instead of importing next, inline account area, PageLayout block, monospace copy value, 401 on logout = signed out, one nav-link style, link panel replaces the form until Done, invited email on /register/mentor, admin home as a dense list, invalid-invitation wording, per-role nav items, Register as outline link). Questions Q6 (second invitation for the same email – spec silent, story removed rather than inventing a rule) and Q7 (reading the invitation server-side to show the email).

Verified: lint OK, typecheck OK, test:coverage OK (237, 100%), build OK, build-storybook OK (9 new docs pages checked in Chromium; every `?path=` link in MDX exists in the story index), test:storybook OK (512/512, both themes; +65 stories, +28 interaction tests), lint:tokens OK (0, 164 files). Screens viewed at 1440 and 320 px in the built Storybook, no page-level horizontal scroll. Fixed on the way: duplicate banner/nav landmarks in the AppHeader per-role story (axe), 401 on logout shown as an error (now treated as signed out), a decision id in product copy, word-mark alignment.

Not run: live app (nothing the app uses changed in this batch). No new dependencies, no CLI. Nothing committed. No `git stash`.

Handoff: owner decisions on C29–C40 and Q6–Q7, then batch 3 (mentor profile and offer) per POSTEP.md 3.4.

### Batch 2 follow-up – Q6/Q7 (2026-10-20)

Owner accepted C29–C40; Q6 (re-inviting revokes the pending invitation, `revokedAt`) and Q7 (`GET /api/auth/invitations/[token]` → `{ email, expiresAt }`, generic `not_found` otherwise) were written into the E01 spec by the coordinator. Applied: `revoked` status and *Revoked* badge; `AdminInvitations/ReinviteRevokesOld` story (stateful MSW handlers); `RegisterMentor` reads the invitation via MSW (Loading, Default with email, InvitationInvalid on 404, UsedMeanwhile, Success); state map and "Link shown once" pattern updated. Gate: lint, typecheck, test:coverage (238, 100%), build, build-storybook (all MDX links resolve), test:storybook (516/516), lint:tokens (0) – all OK. Nothing committed; no dev server started.

## Stage 3, batch 3 (2026-10-20)

Goal: mentor profile and offer (E01 #25–#28): TagList, PublicWorkLinks, PriceList, MentorProfileHeader, OfferChecklist, MentorProfileForm (price fields inside), `parsePrice`/`formatPriceInput`; screens `/mentor` and `/mentor/profile` with MSW; patterns "Amount in PLN" and "Bookability checklist"; E01 state map extended. Batch 2 (with Q6/Q7) committed by the coordinator.

Decisions: proposals C41–C53 in POSTEP.md (price input format, empty parts not rendered, same-tab links, profile-complete rule, checklist accent and statuses, slot counts from SlotDto.bookable, optional prices with early bounds check, bio counter in the hint, 5-link sentence, inline saved status, page titles, name as page title on /m/[slug], 403 as form error). Questions Q8 (what makes the profile complete) and Q9 (where /mentor gets bookable/too-soon counts) – not invented as rules, implemented as marked proposals.

Verified: lint OK (one unused test constant removed), typecheck OK, test:coverage OK (274, 100%), build OK, build-storybook OK (9 pages checked in Chromium, all MDX links resolve), test:storybook OK (638/638, both themes; +61 stories, +17 interaction tests), lint:tokens OK (0, 187 files). Screens viewed at 1440/320 px, no page-level horizontal scroll; checklist rows top-aligned after review; a repeated-sentence long bio replaced with realistic text (rule 7).

Nothing committed, no dev server, no new dependencies, no git stash.

Handoff: owner decisions on C41–C53 and Q8–Q9, then batch 4 (slots and public list) per POSTEP.md 3.4.

### Batch 3 follow-up – Q8/Q9 (2026-10-20)

Owner accepted C41–C53; Q8 (save requires name + headline 1–120; listing depends only on prices + a bookable slot) and Q9 (`SlotDto` = `{ id, startsAt, status, bookable }`, `bookable` computed by the server) are in the E01 spec. Batch 3 already matched both (form validation, SlotDto shape); only comments and docs were re-sourced from "proposal C44/C46" to the spec. Re-run: lint, typecheck, test:coverage (274, 100%), test:storybook (638/638), lint:tokens (0) – all OK. Nothing committed.


## Stage 3, batch 4 (2026-10-20)

Goal: slots and the public list (E01 #27–#28). Continued by a fresh agent after the previous one stopped at the start of batch 4; kept its `formatDay`, `formatTime`, `localDayKey`.

Built: `SlotTimeField` (DST: refuse skipped, preview repeated), `SlotList`/`SlotRow`, `AddSlotForm`, `DeleteSlotDialog`, `MentorCard`, `ActiveFilters`, `ResultCount`; patterns Time with zone and DST, Delete confirmation, List with filters; screens `/mentor/slots`, `/mentors`, `/m/[slug]` (E01, disabled Book with reason); state map extended. Proposals C54–C62 and question Q10 in `packages/ui/POSTEP.md`.

Decisions: UI does not re-check server slot rules (C55); no new dependencies; stateful MSW for the slots screen via story `beforeEach`.

Verified: lint, typecheck, test:coverage (312 tests, 100%), build, build-storybook (all MDX links resolve), test:storybook (810/810), lint:tokens (0, 215 files). Visual check at 1440/320 px found one overflow (long name in `PageLayout` h1), fixed with `break-words`; axe found `aria-required-children` in a MentorCard story, fixed.

Open: C54–C62 and Q10 await the owner; nothing committed.

Handoff: next is batch 5 (E02 booking and payment) per `packages/ui/POSTEP.md` "Następny krok". Note for tests of date inputs: jsdom and Chromium accept `fireEvent.change` with a valid ISO value.


## Stage 3, batch 5 (2026-10-20)

Goal: booking and prepayment screens (E02 #29–#30, #32). Owner had accepted C54–C62 and Q10 (spec E01 updated by the coordinator).

Built: `SlotBookActions`, `BookingSummary`, `QuestionField`, `BookingForm`, `BookingStatusBadge`, `BookingStatusPanel`, `PaymentPending`, `BookingQuestion` (pulled forward from batch 6) and `bookingStatus.ts` (all state-machine wording in one place); screens `/book/[slotId]`, `/bookings/[id]` (with polling) and the E02 `/m/[slug]`; patterns Payment and waiting, Status and next action, Detail view; E02 state map. Proposals C63–C68, questions Q11–Q12 in `packages/ui/POSTEP.md`.

Decisions: spec decisions respected (card only, 35 min hold, price stored by the server, max 2 unpaid, mentee name only to the mentor); the UI shows server wording for refusals and never computes price or deadlines; docs pages for the 8 components generated from one skeleton (scratchpad script, not in the repo) to keep the 13-section structure identical.

Verified: lint, typecheck, test:coverage (362 tests, 100%), build, build-storybook (all MDX links resolve), test:storybook (986/986), lint:tokens (0, 247 files). Visual check at 1440/320 px: no horizontal scroll.

Open: C63–C68, Q11, Q12 await the owner; nothing committed.

Handoff: next is batch 6 (booking lists, mentor decisions, `AcceptDeadline`, `DeclineBookingDialog`, `PendingBookingsNotice`) per `packages/ui/POSTEP.md` "Następny krok". Gotcha: formatted amounts contain a no-break space – use `\u00a0` in accessible-name queries, a plain space in text matchers.
