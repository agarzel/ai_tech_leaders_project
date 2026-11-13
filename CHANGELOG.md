# 0.1.0 (2026-11-13)

## Highlights

The first release of DevMentor, a mentoring marketplace for developers. Admins invite mentors, mentors publish a profile, an offer and bookable slots, and mentees book and prepay a session. The session then gets a thread and a shared note. Every page uses the DevMentor design system. Security hardening comes from the lesson 16 threat model (session revocation, IP rate limits, security headers, no default database credentials). Admin and operator actions are recorded in an audit log. There is no previous version, so nothing needs upgrading. See [UPGRADE_NOTES.md](UPGRADE_NOTES.md) for a first installation.

## ✨ Features

- ✨ Admins see an audit log of role changes, user creation and deletion, mentor invitations, CLI password sets and failed logins. (fixes #119) (#141) *(@agarzel)*
- ✨ Mentors open their own bookings from the header and the mentor pages. (fixes #106) (#133) *(@agarzel)*
- ✨ Session thread and shared session note for a booked session; a mentee can cancel a confirmed booking. (#73, #74) *(@agarzel)*
- ✨ Mentees book a slot and prepay it through the payment gateway (fake gateway and Stripe adapter), with webhook-driven booking transitions and a sweep for expiry, retries and refund reconciliation. (#68, #69, #70, #71) *(@agarzel)*
- ✨ Idempotent demo seeder for admin, mentor and mentee accounts (`npm run db:seed`). (#80) *(@agarzel)*
- ✨ Admins list mentor invitations, and invitation routes are rate limited. (#64, #65) *(@agarzel)*
- ✨ Mentors get a share link and can opt in to the public mentor list. (#57, #58) *(@agarzel)*
- ✨ Mentors publish bookable slots. (#55, #56) *(@agarzel)*
- ✨ Mentor profile entity with session types and tags. (#53) *(@agarzel)*
- ✨ Admins invite mentors by e-mail; an invitation turns into a mentor account. (#52) *(@agarzel)*
- ✨ Email and password sign-in, registration and logout with session cookies, session-based admin, and `auth:set-password` for the first admin. (#50, #51) *(@agarzel)*
- ✨ One-command idempotent local setup (`npm run setup`). (fixes #13) (#14) *(@agarzel)*
- ✨ DevMentor design system: tokens, 66 components, product patterns and Storybook pages. (#39, #41, #42, #43, #44) *(@agarzel)*
- ✨ Reusable API and UI layers with a users reference example. (#8) *(@agarzel)*
- ✨ Health check endpoint that reports database connectivity (`GET /api/health`). (#4) *(@agarzel)*

## 🔒 Security

- 🔒 Logout and password reset revoke every session of the user. (fixes #118) (#124) *(@agarzel)*
- 🔒 Registration is rate limited per IP, and the login lockout is keyed on IP and e-mail. (fixes #110) (#112) *(@agarzel)*
- 🔒 Every response carries security headers. (fixes #111) (#113) *(@agarzel)*
- 🔒 The client IP is read from the trusted end of `x-forwarded-for` (`TRUSTED_PROXY_HOPS`). (fixes #117) (#122) *(@agarzel)*
- 🔒 Docker Compose has no default database credentials and publishes Postgres on 127.0.0.1 only. (#120) (#123, #125) *(@agarzel)*
- 🔒 Every `<form>` must declare its method (lint rule, threat model T-13). (#129) *(@agarzel)*
- 🔒 Lesson 16 threat model, access-boundary tests and SAST/DAST scripts. (#109) *(@agarzel)*
- 🔒 Cleared the high-severity dependency advisories. (#86) *(@agarzel)*
- 🔒 Agent guardrails: deny rules, a PreToolUse hook, CODEOWNERS for agent config and the Claude Code sandbox. (#62, #63, #64) *(@agarzel)*

## 🐛 Fixes

- 🐛 Approving a session note the mentor changed after it was seen is refused. (fixes #136) (#138) *(@agarzel)*
- 🐛 Header links stay on one line and mark the current page. (fixes #137) (#139) *(@agarzel)*
- 💰 Indeterminate Checkout failures stay retryable. (fixes #104) (#126) *(@agarzel)*
- 🐛 A rejected session note can be replaced once. (fixes #96) (#103) *(@agarzel)*
- 💰 Checkout receives the mentee's e-mail. (#102) *(@agarzel)*
- 💰 Failed checkout holds expire. (fixes #95) (#101) *(@agarzel)*
- 💰 Refund retries are idempotent, and refunds are reconciled from the provider's state. (fixes #93) (#99, #100) *(@agarzel)*
- 🔐 Cancel and note endpoints answer 403 to a mentor who booked a session with another mentor. (fixes #94) (#98) *(@agarzel)*
- 🐛 A mentee can hold only a limited number of active unpaid bookings. (fixes #87) (#88) *(@agarzel)*
- 🐛 Unknown booking pages and unknown mentor share links answer 404 instead of 200. (#78, #79) *(@agarzel)*
- 🐛 Domain errors map to HTTP status by shape (no 500 on the slot lead time). (#59) *(@agarzel)*
- 🐛 The rate-limit message matches the prototype. (#61) *(@agarzel)*
- 🐛 The test-environment reuse check sends the CSRF header, and the test server log is written outside the repo. (#82, #134) *(@agarzel)*

## 🛠️ Improvements

- 🛠️ Multi-model agent harness: an implementer plus independent reviewers from different model families. (#140) *(@agarzel)*
- 🛠️ Open Mercato skills installed, synced and refreshed. (#11, #91, #115, #130) *(@agarzel)*
- 🛠️ Agent PR pipeline (SDLC.md, labels, validation gate), and the root AGENTS.md turned into a task router. (#12, #72) *(@agarzel)*
- 🛠️ Node.js 24 LTS locally, in CI and in Docker; lockfile rewritten with its npm. (fixes #19) (#114, #121) *(@agarzel)*
- 🛠️ Vitest family bumped to 5.0.5, with Dependabot configured. (#92) *(@agarzel)*
- 🛠️ Lint ignores Cezar task worktrees and installed skills. (fixes #105) (#127, #132) *(@agarzel)*
- 🛠️ Monorepo split into `app`, `core`, `db` and `ui` packages on MikroORM, Awilix and shadcn/ui. (#6, #7) *(@agarzel)*
- 🛠️ `db:up` and `db:down` scripts. (#49) *(@agarzel)*

## 🧪 Testing

- 🧪 `inviteMentor` fails fast with the reason in integration tests. (fixes #116) (#128) *(@agarzel)*
- 🧪 Integration tests for webhook replay, late cancellation and more; integration-test overrides. (#84) *(@agarzel)*
- 🧪 Generated test-environment scripts (om-prepare-test-env). (#81) *(@agarzel)*
- 🧪 Storybook focus assertions no longer flaky; agent test of the design system and its gaps closed. (#45, #46) *(@agarzel)*
- 🧪 Integration tests with testcontainers and agent-browser. (#10) *(@agarzel)*
- 🧪 Unit tests with a 100% coverage gate. (#9) *(@agarzel)*

## 📝 Specs & Documentation

- 📝 Deploying behind a reverse proxy (threat model T-03). (#131) *(@agarzel)*
- 📝 Lesson 18 QA session: knowledge base and evidence card. (#135) *(@agarzel)*
- 📝 Finished specs moved to `implemented/`, and stale statuses fixed. (#90) *(@agarzel)*
- 📝 Epic 01–03 tracks, closing notes and decisions (e-mail verification, GitHub sign-in, Stripe run before launch). (#60, #67, #75, #76, #77) *(@agarzel)*
- 📝 Epic 01 screen map, gray and clickable prototypes. (#47, #48) *(@agarzel)*
- 📝 Specs for mentor accounts and offer, and for booking and prepayment. (#38) *(@agarzel)*
- 📝 Product discovery: brief, decisions and backlog. (#37) *(@agarzel)*
- 📝 DevMentor extension of om-code-review. (#15) *(@agarzel)*
- 📝 AGENTS.md rules, CLAUDE.md and the `.ai/` metadata structure. (#5) *(@agarzel)*
- 📝 Personal course notes folder ignored. (#20) *(@agarzel)*

## 🚀 CI/CD & Infrastructure

- 🚀 Nightly CI run with a dependency audit; hardened Chrome install step. (#85) *(@agarzel)*
- 🚀 agent-browser Chrome cached in the integration job; integration screenshots uploaded from the hidden `.artifacts` folder. (#66, #83) *(@agarzel)*
- 🚀 GitHub Actions CI. (#3) *(@agarzel)*
- 🚀 Docker image with Next.js standalone output, and Docker Compose with PostgreSQL. (#1, #2) *(@agarzel)*

## 👥 Contributors

- @agarzel
