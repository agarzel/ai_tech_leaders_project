# BOOKINGS-001 – A repeated payment webhook changes nothing

- **Area:** BOOKINGS · **Priority:** High · **Type:** API + UI
- **Rule:** payment events are applied once – a repeated or racing webhook changes nothing twice (`.ai/specs/implemented/2026-10-19-booking-and-prepayment.md`, payment webhook; `BookingTransitions`).
- **Test:** [packages/app/tests/integration/booking-webhook-replay.int.test.ts](../../../packages/app/tests/integration/booking-webhook-replay.int.test.ts) › "keeps a confirmed, paid booking unchanged and records one payment when the same paid event arrives again"

## Given
- A mentor with prices and a slot 3 days ahead; a mentee booked 25 minutes and paid on the fake checkout.
- The mentor accepted: the booking is `confirmed`, payment `paid`.

## When
- The same signed "checkout completed, paid" event (fake gateway, `x-fake-signature`) is posted to `/api/payments/webhook` twice more.

## Then
- Both deliveries answer 200 (the provider must not keep retrying).
- The booking stays `confirmed` with payment `paid` – not back to `awaiting_acceptance`.
- One payment row for the booking, status `paid` (no refund requested).
- The mentee's booking page still shows "Confirmed".

## Edge cases not covered here
- Replay of a completed event for a booking already cancelled or declined (should not re-open it).
- An event with an invalid signature – covered in `bookings.int.test.ts` ("protects the sweep and the webhook…").
