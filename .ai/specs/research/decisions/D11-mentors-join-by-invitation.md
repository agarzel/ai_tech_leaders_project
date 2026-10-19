# D11 — Mentors register only through an invitation link issued by an admin; every admin is a founder; mentees self-register
- Date, owner: 2026-10-19, Arkadiusz, confirmed at the Open Questions gate of `.ai/specs/2026-10-19-mentor-accounts-and-offer.md` and in the cross-model review
- Context and the options weighed: mentor role chosen at registration; admin promotes a mentee; invitation link only.
- Decision and why: invitation link, single use, 14 days. It matches the recruitment test (A02: invite the first batch from 29 warm contacts and record who joins) and keeps the mentor list curated. The admin role is held only by the founders; the first admin is created only with `npm run auth:create-admin`, which needs database access. Origin: the agent's recommendation, accepted by the owner.
- Consequences, and what would make us revisit it: mentors cannot join on their own; revisit when the founders want open mentor sign-up.
- Status: active
