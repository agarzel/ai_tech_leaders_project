# BOOKINGS-002 – Two active unpaid bookings per mentee

- **Area:** BOOKINGS · **Priority:** High · **Type:** API
- **Rule:** a mentee may hold at most two unexpired `pending_payment` bookings; parallel creates for different slots must serialize on the mentee row (`.ai/specs/implemented/2026-10-19-booking-and-prepayment.md`, “Slot hoarding”).
- **Test:** [packages/app/tests/integration/bookings.int.test.ts](../../../packages/app/tests/integration/bookings.int.test.ts) › “serializes parallel creates and limits each mentee to two active unpaid bookings”

## Given
- A mentee with one active unpaid booking and several open slots.

## When
- Two create requests for different slots run concurrently.
- Another create is attempted after two active unpaid bookings exist.
- One hold expires and a further create is attempted.

## Then
- Exactly one parallel request succeeds, and the other answers 409 with “Finish or abandon your previous payment first”.
- A third active unpaid booking is refused.
- An expired hold no longer counts toward the cap; paid bookings also do not count.
