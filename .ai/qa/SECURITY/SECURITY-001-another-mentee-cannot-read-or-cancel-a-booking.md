# SECURITY-001 – Another mentee cannot read or cancel a booking

- **Area:** SECURITY · **Priority:** High · **Type:** API
- **Rule:** only the booking's mentee reads or cancels it; anyone else gets 404, so its existence is not revealed (threat model T-04, `docs/security/threat-model.md`; routes `api/bookings/[id]`, `api/bookings/[id]/cancel`).
- **Test:** [packages/app/tests/integration/access-boundaries.int.test.ts](../../../packages/app/tests/integration/access-boundaries.int.test.ts) › "answers 404 when another mentee reads or cancels the booking, and the booking and payment stay as they were"

## Given
- A confirmed, paid booking of mentee A, three days ahead.
- Positive controls: mentee A reads the booking (200, confirmed); mentee B is signed in and reads their own list (200).

## When
- Mentee B reads (GET) and cancels (POST) mentee A's booking by its id.

## Then
- Both answer 404 with no booking data.
- Mentee A reads exactly the same booking as before, and the payment row (status, amount) is unchanged.

## Edge cases not covered here
- An anonymous visitor (401 from the session check).
- A mentor who is the booking's mentor (`mentor-booking-mentor.int.test.ts`).
