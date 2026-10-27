# Lesson 11 – closing the homework (DevMentor, Epic 02 and E03)

Course homework (lesson 11): finish the remaining Epic 02 slices, close Epic 02, write the E03 spec and run autonomous coding from it.

## Status
- Epic 02: phases 1 and 2 merged (PRs #68–#71). Track tasks 2.1–2.6 are in code; the integration suite passes locally (56 tests). Open, owner only: a manual Stripe test-mode run (needs test keys) and the screenshots `bookings-*`. The spec `2026-10-19-booking-and-prepayment.md` stays in `.ai/specs/` until both are done.
- E03 (session and aftermath): merged in PR #73 (rules, entities, services) and PR #74 (routes, pages, cancellation, Storybook, integration test). Backlog #33, #34 and #36 are done. #35 (no-show) waits for Q03, so the spec `2026-10-27-session-and-aftermath.md` stays in `.ai/specs/`.
- Autonomous coding: done by hand with the same gates, not by `om-auto-create-pr-loop`, because the run needs `gh` (claims, PRs) and Docker (integration gate), which the agent sandbox does not have. The lesson's point (spec first, gates, reviewable PRs) is kept.

## The course snapshot after lesson 11
The download `ai-techleaders-project-after-lesson-11` is a different repository state (its own E02 spec `mentors-become-bookable`). It was used as a checklist, not copied over. Traps from its notes, checked against this repository:
- Double booking across session lengths: publishing a slot requires 50 minutes from every other slot of the mentor, under a row lock on the mentor profile (`SlotService.publish`). A 50-minute booking cannot overlap the next slot.
- A relation declared before its column: the generated migrations match the snapshot (`db:migration:check`: "No changes required").
- Session cookie after granting a role: the invitation flow signs the mentor in (integration test "registers the mentor, signs them in").

## Decisions
- No overwrite of the repository with the course snapshot.
- The duplicate migration found during the cancellation work was removed; only the generated migration and its snapshot stay.

## Verification
- Epic 03 branch merged after: lint, typecheck, `lint:tokens`, `docs:design-system:check`, `test:coverage` (88 files, 1065 tests), `db:migration:check`, `test:integration` (10 files, 59 tests), `test:storybook` (184 files, 1120 tests), `build`.

## Owner steps
1. Epic 02: run the Stripe test-mode check with the Stripe CLI and add the `bookings-*` screenshots; then move the booking spec to `.ai/specs/implemented/`.
2. Epic 03: decide Q03 (no-show proof) and then #35; move the E03 spec to `implemented/` after #35.
3. Course page: tick the lesson checklist items that are done.
