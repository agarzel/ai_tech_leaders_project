# BOOKINGS-003 – A mentor who booked another mentor is not locked out of their own booking

- **Area:** BOOKINGS · **Priority:** High · **Type:** API
- **Rule:** any signed-in user may book, and a mentor may book other mentors (`.ai/specs/implemented/2026-10-19-booking-and-prepayment.md`); the booking's mentee is whoever booked it, independent of their account's stored role. Cancel, note-read and note-approve check booking ownership, not the `UserRole` on the session.
- **Test:** [packages/app/tests/integration/mentor-booking-mentor.int.test.ts](../../../packages/app/tests/integration/mentor-booking-mentor.int.test.ts)

## Given
- Mentor A offers 25-minute sessions and publishes a slot.
- Mentor B — a mentor account, not a mentee — books and pays for that slot; Mentor A accepts.

## When
- Mentor B cancels the confirmed booking before the free-cancellation deadline.
- On a second booking, Mentor A writes a session note after the session ends; Mentor B reads it and approves it.

## Then
- The cancellation succeeds (`200`, `outcome: "refunded"`), not a `403`.
- Reading and approving the note succeed (`200`), not a `403`.
- Someone who is genuinely not the booking's mentee — here, Mentor A, on Mentor B's booking — still gets `404` on all three endpoints, mentor role or not.

## Edge cases not covered here
- The free vs. late cancellation boundary — covered in `session.int.test.ts` and `session-late-cancel.int.test.ts`.
- A note past its approval window — covered by `session-rules` unit tests.
