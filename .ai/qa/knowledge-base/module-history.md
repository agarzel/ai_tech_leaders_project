# QA module history

One row per QA buddy session. Append only.

| Date | Target | Module(s) | Cases (P0/P1/P2) | Result | Bugs | Notes |
|---|---|---|---|---|---|---|
| 2026-11-04 | PR #133 (#106) | Site header / bookings navigation | 8 (2/4/2) | AI: 7/8 pass, 007 (375 px) needs a human | 0 | Fresh test accounts: mentee via /register, admin via auth:set-password --admin (owner's terminal: the CLI reads .env, blocked for the agent), mentor via admin invitation; test server reload loop (log inside the repo watched by Turbopack) fixed on fix/test-env-log-outside-watch before the run |
| 2026-11-05 | PR #133 (#106), human pass | Site header / bookings navigation | 3 (001, 002, 007) | Human: 3/3 pass; found 2 P2 polish issues the AI missed | 0 (2 P2 follow-ups) | "My bookings" wraps at 375 px (navLinkClassName lacks whitespace-nowrap); header never sets aria-current, so the current page is not marked |
