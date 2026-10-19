# D09 — Answers Q02: in 1.0, slots starting less than 12 hours ahead are not bookable
- Date, owner: 2026-10-19, Arkadiusz (product owner of this repository), confirmed at the Open Questions gate of `.ai/specs/2026-10-19-mentor-accounts-and-offer.md`
- Context and the options weighed: R05/D07 close acceptance 12 hours before the session, so a booking made later could never be accepted. Options: hide slots starting within 12 hours; auto-confirm short-notice bookings (would supersede part of R05); a shorter acceptance window for short-notice bookings (new rule).
- Decision and why: hide them. No business rule changes; the simplest rule to build and explain. Origin: the agent's recommendation, accepted by the owner.
- Consequences, and what would make us revisit it: 1.0 cannot serve same-day help; urgent developers (A01, the brief's main mismatch, and the synthetic panel's strongest seen-once item) are not served. Revisit with booking data — how far away the nearest slot was and whether the developer booked or left.
- Status: active
