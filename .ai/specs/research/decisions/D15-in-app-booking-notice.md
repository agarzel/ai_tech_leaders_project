# D15 — Mentors learn about new bookings in the app only; email is a later, separate spec
- Date, owner: 2026-10-19, Arkadiusz, confirmed at the Open Questions gate of `.ai/specs/2026-10-19-booking-and-prepayment.md`
- Context and the options weighed: no email sending exists; adding transactional email means a new provider and dependency.
- Decision and why: `/mentor` lists pending bookings with a countdown to the acceptance deadline. Origin: the agent's recommendation, accepted by the owner.
- Consequences, and what would make us revisit it: mentors who do not open the app lose bookings, which expire into refunds; a high expiry rate is the signal to add email.
- Status: active
