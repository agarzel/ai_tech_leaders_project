# D14 — The platform's Stripe account collects the full price; mentor payouts are a later, separate spec
- Date, owner: 2026-10-19, Arkadiusz, confirmed at the Open Questions gate of `.ai/specs/2026-10-19-booking-and-prepayment.md`
- Context and the options weighed: the commission (Q01) and the timing of mentor payout details (Q05) are open; Stripe Connect now would require every mentor to onboard to Stripe, which one interviewed mentor refused before a first booking.
- Decision and why: prepayments go to the platform's account; no Connect in the booking spec. Origin: the agent's recommendation, accepted by the owner.
- Consequences, and what would make us revisit it: mentors are not paid automatically until the payout spec exists; it must land before launch together with Q01 and Q05.
- Status: active
