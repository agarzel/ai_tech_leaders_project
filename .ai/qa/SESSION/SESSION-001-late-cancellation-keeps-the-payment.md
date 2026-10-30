# SESSION-001 – A late cancellation keeps the payment

- **Area:** SESSION · **Priority:** High · **Type:** UI
- **Rule:** cancelling is free until 12 hours before the session; later the mentor keeps the payment, and from the start it is refused (R04, `.ai/specs/2026-10-27-session-and-aftermath.md`; `cancellationOutcome`).
- **Test:** [packages/app/tests/integration/session-late-cancel.int.test.ts](../../../packages/app/tests/integration/session-late-cancel.int.test.ts) › "cancels a confirmed booking 6 hours before the start without a refund, and tells the mentee before and after"

## Given
- A confirmed, paid 25-minute booking.
- The session starts in 6 hours (the slot's start is moved in the database) – inside the 12-hour window.

## When
- The mentee opens the booking page, clicks "Cancel booking" and confirms in the dialog.

## Then
- Before confirming, the dialog says "The free cancellation period has ended." and that the mentor keeps the payment.
- The page shows "Cancelled — no refund".
- The booking is `cancelled` with reason `mentee_late`; the payment stays `paid` (no refund requested).

## Edge cases not covered here
- Exactly at the 12-hour boundary (unit-tested in `session-rules`).
- Cancelling after the session has started (refused with 409).
- The free path – covered in `session.int.test.ts` ("…before the free deadline and sees the refund on its way").
