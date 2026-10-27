# Session and aftermath (Epic 03)

Status: **ready for implementation** (phases 1–3). Open Questions 1, 2, 4 and 5 are answered with the recommendations below, accepted by the owner on 2026-10-27 ("rekomendowane"). Question 3 (Q03) stays open and keeps #35 out of this spec.

## 📝 TLDR
Future behavior: a booked session takes place at its time as a text exchange between the mentor and the mentee; the mentee can cancel and sees whether the booking is refunded; the mentor can write an optional private note that the mentee approves before anyone else sees it. This spec covers backlog #33, #34 and #36 (epic #23). No-show settlement (#35) is parked until Q03 is answered. It reuses the booking state machine, the payment port, `SweepService` and the booking screens from `2026-10-19-booking-and-prepayment.md`.

## 📝 Problem Statement
After a booking is confirmed (Epic 02) nothing happens in the product: the session itself, a cancellation and a note all live outside it, and the money is only settled by the sweep. The brief asks for four things after acceptance: the session at the booked time (R01), free cancellation until 12 hours before and a clear refund answer (R04), a note the mentee controls (R02, R06). Mentors asked for a note they can keep for later (D06), mentees asked to keep their own answers (D06), so the note needs consent on both sides.

## 📝 Proposed Solution
Three slices on top of the confirmed booking:
1. **Session window (#33).** For a confirmed booking the session opens at `startsAt` and closes at `startsAt + lengthMinutes`. Both sides see the question and a text thread for that window. Nothing is recorded outside the thread.
2. **Cancellation (#34).** The mentee cancels a `confirmed` booking. Before `startsAt − 12 h` the cancellation is free and refunded in full (R04). After that the booking is cancelled without refund, and the mentor keeps the payment (R04). The refund and the mentor's share are written to the booking's payment record so the state is visible; paying the mentor out is out of scope (D14, Q05).
3. **Private note (#36).** After the session the mentor may write one short note. It stays in state `draft` until the mentee approves it; only an approved note is shown, and only to the mentee (R02, R06). Unapproved notes are never shown to anyone but the mentor.

Recommended defaults for the open questions are marked *Recommendation*; they apply if the owner accepts them.

## 📝 Architecture
- **Core:** `SessionService` (window checks, thread access), `BookingService.cancel` (new transition in the existing state machine, same row lock as the other transitions), `SessionNoteService` (draft, submit, approve, read). Stripe stays behind the existing port; cancellation does not call Stripe unless a refund is due.
- **Db:** a `SessionNote` entity and one `Message` entity for the thread, both keyed to the booking. Migrations as usual, reviewed SQL where the generator cannot run in the sandbox.
- **App:** the booking detail page gains a thread, a *Cancel* action (mentee) and a note panel (mentor writes, mentee approves). The mentor booking list shows the session window.

## 📝 Data Model
| Entity | Fields | Notes |
|---|---|---|
| `Message` | `id`, `bookingId`, `authorUserId`, `body` (max 2000 chars), `createdAt` | append-only; readable by the two parties of the booking |
| `SessionNote` | `id`, `bookingId` (unique), `body` (max 1000 chars), `status` (`draft`, `approved`, `rejected`), `createdAt`, `decidedAt` | one note per booking; approved notes are the only ones the mentee sees |
| `Booking` (existing) | new `cancelledAt`, `cancelReason` (`mentee_free`, `mentee_late`) | new statuses `cancelled` in the existing enum; a cancelled booking releases the slot through the conditional `SlotService.release` |

## 📝 API Contracts
| Route | Who | Behaviour |
|---|---|---|
| `GET/POST /api/bookings/[id]/messages` | the booking's mentee or mentor | list / append a message; only inside the session window (plus 24 h after it ends for reading) |
| `POST /api/bookings/[id]/cancel` | the mentee | `confirmed` only; returns the outcome (`refunded` or `not_refunded`) |
| `PUT /api/mentor/bookings/[id]/note` | the mentor | create or replace a `draft` note; an approved note is final |
| `POST /api/bookings/[id]/note/approve` | the mentee | `approve` or `reject` a `draft` note |

All state-changing routes use the existing envelope and `x-devmentor-client: 1`.

## 📝 UI/UX
- Booking detail (mentee and mentor): the question, the thread, the session window, and the cancel action with its deadline shown in plain words ("free until 14:00 on 3 Nov, after that the mentor keeps the payment").
- Note panel (mentor): a text area after the session ends; "Waiting for approval" while `draft`. Mentee: "Approve" / "Reject" with the note shown in full before the choice.
- No notifications beyond the in-app notice (D15).

## 📝 Edge Cases & Failure Scenarios
- Cancel and the sweep race: the cancel transition takes the booking row lock and is a no-op if the booking already left `confirmed`.
- Cancel after `startsAt`: refused (`conflict`), the session goes ahead.
- Message after the window: refused; the window closes at `startsAt + lengthMinutes`.
- Note before the session ends: refused.
- Note edited after approval: refused; a rejected note can be replaced once.
- Refund failure on a free cancellation: the booking is `cancelled` with `refund_failed` and enters the existing refund reconciliation (max 3 tries, then manual).

## 📝 Risks & Impact Review
- **Money (risk-high):** cancellation touches refunds. QA and a second reviewer required, no self-QA. Test mode only.
- **Privacy:** messages and notes are personal data; they are never logged, and never shown outside the two parties.
- **Scope creep:** a chat that grows into a real-time product. Kept to append-only text inside a time window.

## 📝 Decisions in play
- **D04** (R04): free cancellation until 12 h before; later cancellation keeps the payment for the mentor; mentor no-show refunds in full.
- **D06** (R06): the note is optional, written by the mentor, approved and visible only to the mentee.
- **R02**: nothing from a session is published without the mentee's approval.
- **D14 / Q05**: payouts and Connect are a later spec; the mentor's share is recorded, not paid out.

## 📝 Open Questions
Answered by the owner on 2026-10-27 (recommendations accepted):

1. **Where does the text session happen?** In-app thread, text only, no attachments.
2. **What does "the mentor keeps the payment" mean before payouts exist (D14, Q05)?** Record `mentorShareAmount` on the payment; the money stays on the platform account until the payouts spec.
3. **Q03: how is a mentor no-show proven?** **Still open.** #35 is out of this spec and gets its own spec once Q03 is decided.
4. **How long does the mentee have to approve a note?** 7 days; then the draft becomes `rejected` automatically and is never shown.
5. **Can the mentee cancel after the window closes?** No; after `startsAt` the session is the outcome.

## 📋 Phasing
1. **Session window and thread (#33)** — `Message`, window checks, thread routes and UI. No money.
2. **Cancellation (#34)** — `cancelled` status, cancel transition, refund or retained-share record, reconciliation reuse. Depends on 1 only for the booking screens.
3. **Private note (#36)** — `SessionNote`, draft/approve/reject, routes and panel. Independent of 2.

## 📋 Implementation Plan
Written after the Open Questions are answered. Each phase follows the per-task discipline of the Epic 02 track: subagent per task, gates (lint, typecheck, coverage 100%, build), commit, track entry.

### Phase 1 — Session window and thread (#33)
1. `Message` entity + migration; `SessionService.assertInWindow`.
2. Thread routes, booking-detail thread UI, Storybook story for the thread component.
3. Unit tests for window edges (exact start, exact end, 24 h read grace) and access (other users refused).
4. Integration test: mentee and mentor exchange two messages inside the window; a third request after the window is refused.

### Phase 2 — Cancellation (#34)
1. `cancelled` status, `cancelledAt`, `cancelReason`; `BookingService.cancel` transition with the row lock.
2. Refund path through the existing payment port; retained-share record for late cancellation (Q02).
3. Route, cancel action with its deadline text, refund outcome shown on the booking.
4. Unit tests: every transition row (free, late, after start, race with sweep).
5. Integration test: free cancellation refunds; late cancellation shows "not refunded" and frees nothing extra.

### Phase 3 — Private note (#36)
1. `SessionNote` entity + migration; `SessionNoteService` (draft, approve, reject, expiry after 7 days).
2. Routes, mentor note panel, mentee approve/reject panel.
3. Unit tests for every status transition, the expiry, and that an unapproved note is never returned to the mentee.
4. Integration test: mentor writes, mentee approves, note visible; a rejected note is hidden.

Done for the spec: all three phases merged; the gate green; a manual check on Stripe test mode for the cancellation refund recorded in the PR; #33, #34 and #36 closed. #35 is tracked separately.
