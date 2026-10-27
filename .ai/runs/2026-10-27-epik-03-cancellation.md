# Epik 03 – cancellation (#34), story and docs for the thread and note

Spec: `.ai/specs/2026-10-27-session-and-aftermath.md`, S02 (cancellation). Branch: `epik-03-routes`.

## Done
- Status `cancelled` (db constants, `Booking.cancelledAt`, `Booking.cancelReason` as `mentee_free` or `mentee_late`, `Payment.mentorShareAmount`).
- `BookingTransitions.cancelByMentee`: row lock, mentee only (others get `not_found`), only from `confirmed`, free until 12 h before the start (refund requested, performed by the sweep), later the mentor keeps the payment (share recorded). The slot is released.
- `POST /api/bookings/[id]/cancel` returns `{ outcome, booking }`.
- Mentee booking page: *Cancel booking* (AlertDialog) while the session has not started; the deadline and the no-refund wording come from the server (`freeCancellationUntil`).
- Labels and descriptions for `cancelled` (mentee: refunded, refund on its way, delayed, or no refund; mentor: no refund wording).
- Storybook: stories and documentation pages for `SessionThread`, `SessionNotePanel`, `SessionNoteEditor` and `CancelBookingDialog`; new E03 group in the catalogue; design-system tables regenerated (`docs:design-system:check` passes). `build-storybook` passes.

## Verification (agent sandbox)
- `npm run typecheck`, `npm run lint`, `npm run lint:tokens`: pass.
- `npm run test:coverage`: pass (88 files, 1065 tests, 100% gate).
- `npm run build-storybook`: pass.
- `npm run test:storybook`: not run here: the sandbox blocks the local port (`listen EPERM`). Owner runs it in the terminal.

## Deviations, to confirm
- Two existing tests changed on purpose: the state list now includes `cancelled`; the "unknown status" example is `refunded` instead of `cancelled`.
- `readForMentee` now returns a draft, so the mentee can decide. Rejected notes and expired drafts are still never returned.

## Owner steps
1. Migration: `Migration20261027150000_booking_cancellation.ts` is hand-written and the snapshot is not updated. Run `npm run db:migration:create` with Docker. If it writes the same three columns again, delete the hand-written file and keep the generated one with its snapshot. Then `npm run db:migration:check` must say "No changes required".
2. `npm run test:integration`, `npm run test:storybook`, `npm run build` in the terminal.

## Not done
- Integration test for the thread, note and cancellation with a screenshot (app rule: every user-facing flow has one).
- Mentor-side cancellation notice (the mentor sees the status only).
