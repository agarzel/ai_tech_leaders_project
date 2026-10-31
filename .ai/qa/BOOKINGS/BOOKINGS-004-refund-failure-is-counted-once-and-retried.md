# A failed refund webhook is counted once and the sweep retries it

- **Area:** BOOKINGS
- **Priority:** P0
- **Type:** API
- **Business rule:** A provider refund failure counts once per refund ID, even when webhooks are redelivered or the sweep also sees it. An in-flight refund must not be duplicated. The refund lifecycle is defined in [the booking and prepayment spec](../../specs/implemented/2026-10-19-booking-and-prepayment.md#refund-lifecycle).
- **Test:** [packages/app/tests/integration/refund-retry.int.test.ts](../../../packages/app/tests/integration/refund-retry.int.test.ts) › "counts a failed refund webhook once and lets the sweep retry it successfully"

## Given

- A mentee has paid for a booking with the fake payment provider.
- The mentor declines the booking, leaving its payment in `refund_requested`.

## When

- The same signed `refund.updated` failure event is delivered twice for one refund ID.
- The scheduler runs the refund sweep.

## Then

- The failed refund ID appears once in the payment's recorded failure IDs and `refundAttempts` is 1.
- The sweep retries through the fake gateway and settles the payment as `refunded` without increasing the failure count.

## Edge cases not covered

- A provider refund remains pending across multiple sweeps; unit coverage verifies that the sweep does not create a second refund.
- Multiple distinct failed refund IDs reaching the maximum attempts are covered by unit tests.
