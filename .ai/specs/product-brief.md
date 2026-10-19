# DevMentor — product brief

- Date: 2026-10-19
- Mode: own; Owner: Arkadiusz (product owner of this repository); Pass: full
- Evidence basis: seven interviews held by the two founders between 2026-08-20 and 2026-09-03 (four developers – three who were stuck and one who solves problems alone – and three senior engineers who help others), one 14-day export of help threads from one developers' Discord (109 threads), one self-selected survey in the same community (54 answers, stated intentions), five competitor pages checked on 2026-09-04, and the founders' workshop and board. Observations come from the interviews and the export; scope, rules and targets are decisions. The most consequential untested belief: that mentors invited from the founders' list will join and publish paid availability (A02) – nobody has been contacted yet.
- Coverage: 51 claims — 46 sourced (interview 10, data 5, document 26, product 0, benchmark 5), 0 synthetic, 5 assumed; 2 entries on the collection plan
- Synthetic hypotheses outside Coverage: 0
- Definition of Ready signed by: not yet signed – the team (owner) signs after Q01–Q04 are answered; ready for: implementation planning of the booking-and-session scope below with the short-notice rule decided by D09 (no bookings within 12 h, so no same-day help in 1.0); demand (A01, A03) is not tested before the build; the launch waits for the mentor recruitment test (A02) and Q01, Q04
- Sources: `.ai/specs/research/` (interviews `2026-08-20-*`, `2026-08-22-*`, `2026-09-01-*`, `2026-09-02-interview-*`, `2026-09-03-*`; data `2026-09-04-discord-help-requests.csv` with `2026-09-04-data-request-discord-help.md`, `2026-09-04-survey-discord-willingness-to-pay.md`, `2026-09-04-mentor-list*.{csv,md}`; benchmarks `2026-09-04-benchmark-*.md`; workshop and board `2026-08-26-workshop-export.md`, `2026-09-0*-miro-board-*.md`; decisions `decisions/`)

## Decision summary

The decision for version 1.0 is agreed: paid, booked text sessions between a developer and a senior engineer; the mentor-owned knowledge vault, MCP access and subscriptions move to Later (D01).
Developers in the interviews got stuck on a specific problem with nobody to ask and lost hours to days; in one Discord, a fifth of help threads never got an answer and the median wait was 67 minutes (see Problems). Senior engineers already answer questions unpaid; two of them said their notes are the real value and want them to earn without a call – the need 1.0 defers (D01, see Target group).
Version 1.0 lets a mentor publish slots and a price, share a personal link and opt in to a public list (D03, D08); the mentee books a 25- or 50-minute text slot, writes the question and prepays; the mentor accepts the question (D05, D07); cancellations and no-shows follow D04; an optional private note follows the session (D06). No video (N01), no ratings (N02).
The mismatch most likely to change this: developers described needing help within 20 minutes to the same day, while 1.0 books a slot and, under R05/D07, cannot confirm any booking made less than 12 hours ahead – so none of the three urgent cases in the interviews could be served, while the free Discord alternative answered in a median 67 minutes (D02, A01, Q02). Second: whether invited mentors join at all (A02), the owner's stop signal.
Next: invite the first mentors from the list and record who joins and publishes availability (Collection plan); answer Q01–Q04 before launch. Owner: Arkadiusz; dates not set.

## Vision

The team's intended direction: mentors earn twice – once for the session and again whenever the knowledge from it helps someone else; 1.0 tests only the first half. `[DOCUMENT]` `2026-09-02-miro-board-vision-target-needs.md`, D01

## Target group and stakeholders

- Customer (pays): the developer who books; asked who would pay, 24 of 54 survey respondents said themselves and 19 said their employer (13 if they asked, 6 without asking); one interviewee pays only when it can be expensed. `[DATA]` `2026-09-04-survey-discord-willingness-to-pay.md`
- The interview accounts split the same way: one would pay from his own pocket ("chyba"), one "poniżej 200 to tak, z wlasnego", one "nie płacę za rzeczy do pracy sam". `[INTERVIEW]` `2026-09-01-*`, `2026-09-02-interview-freelancer-react.md`, `2026-09-02-interview-platform-dev-solves-alone.md`
- User (mentee): a working developer or freelancer stuck on a specific technical problem with no senior available at that moment (three accounts: a release the next day, a Friday-evening outage before a Monday release, a client estimate due in two days). `[INTERVIEW]` `2026-08-20-*`, `2026-09-01-*`, `2026-09-02-interview-freelancer-react.md`
- Not every developer has this problem: a platform developer at a 200-person company solves such problems alone or on the internal channel and would pay only for a rare, expensable one-off. `[INTERVIEW]` `2026-09-02-interview-platform-dev-solves-alone.md`
- User (mentor): a senior engineer who already answers recurring questions unpaid in DMs, Slack or Discord from a private notes file and wants those notes to earn without a call. `[INTERVIEW]` `2026-08-22-interview-mentor.md`, `2026-09-03-interview-senior-python-meetups.md`
- A third senior engineer answers only questions she finds interesting, wants no ongoing relationship and does not need the money. `[INTERVIEW]` `2026-09-03-interview-staff-engineer-declined-before.md`
- Stakeholders: two founders cover every internal role today; QA and legal have nobody assigned; Stripe is the payment provider. `[DOCUMENT]` `2026-09-05-miro-board-raci-matrix.md`, `2026-08-26-workshop-export.md`
- Decider for scope decisions: Arkadiusz (product owner of this repository); the workshop named founder A as decider of the earlier decisions N01, N02.

## Problems, with evidence

- A developer stuck the day before a release spent 40 minutes searching, got two contradictory Discord answers and shipped a workaround he still does not trust ("half a day"). `[INTERVIEW]` `2026-08-20-interview-working-dev.md`
- A backend developer's Friday-evening outage before a Monday release ended in a rollback and a one-day slip after an hour of searching and a wrong Discord answer the next day; frequency unknown, one Friday told as if it were the norm. `[INTERVIEW]` `2026-09-01-interview-backend-dev-fintech.md`
- A freelancer underpriced a migration estimate after two evenings of reading and an "it depends" answer, losing about a week of unpaid time. `[INTERVIEW]` `2026-09-02-interview-freelancer-react.md`
- In one developers' Discord, 23 of 109 help threads in 14 days got no human reply; the 86 answered waited a median 67 minutes (31 within 30 minutes). One community, two weeks; the founder's reading aid says 68. `[DATA]` `2026-09-04-discord-help-requests.csv`
- 31 of those threads carried an urgency signal ("release tomorrow", "prod is down"); 9 got no reply and 8 ended resolved. Resolution is the poster's own word in the thread. `[DATA]` `2026-09-04-discord-help-requests.csv`
- 30 of 54 survey respondents were last stuck with nobody to ask this week or this month; 3 have ever paid anyone for help. `[DATA]` `2026-09-04-survey-discord-willingness-to-pay.md`
- Senior engineers answer the same questions repeatedly without pay ("two evenings a month, for free, and the notes rot"; "te same trzy pytania w kółko"). `[INTERVIEW]` `2026-08-22-interview-mentor.md`, `2026-09-03-interview-senior-python-meetups.md`
- Whether a paid session is the help these developers want, and at what speed, is not established: see A01, A03.

## Product and how it stands out

- What it is: a place to book and pay a senior engineer for a 25- or 50-minute text session about one specific problem; see Scope. `[DOCUMENT]` D01
- What makes it different: text first, the question up front, no ratings and a link to the mentor's public work – an explicit hypothesis that this is what developers and mentors prefer (A01–A03), drawn from the interviews and N01, N02. `[ASSUMPTION]` founders' board and interviews

| reference | what it does well | where it falls short for our users | checked on | link |
|---|---|---|---|---|
| Codementor | request-to-live-session path for code help, on demand – closest to the 1.0 job and faster than a booked slot | live call rather than text; $15–80 per 15 min; every card rated 5.0; keeps nothing (1.0 keeps only a private note) | 2026-09-04 | https://www.codementor.io/react-experts |
| MentorCruise | free intro call, long-term mentor | monthly commitment a mentor refused; nothing reusable (the same holds for 1.0 until the vault) | 2026-09-04 | https://mentorcruise.com/ |
| Topmate | expert owns page, price and link; 10% via own link, 20% via marketplace | any profession; no way to find an expert with a blocker | 2026-09-04 | https://topmate.io/pricing |
| Preply | 25/50-min trial, free cancel up to 12 h before | recurring lessons, not one-off blockers; ratings on every card | 2026-09-04 | https://preply.com/en/how-it-works |
| ADPList | booking in minutes, session count as a trust signal | free; no mentor earnings stated; career rather than code | 2026-09-04 | https://adplist.org/ |

## Goals and success criteria

- Business goal: mentors earn from paid text sessions in 1.0 (D01); the board's yearly targets (100 mentors with vaults, 30% on vault subscriptions) belong to the vault and are not 1.0 targets. `[DOCUMENT]` `2026-09-02-miro-board-product-goals.md`, D01
- User outcome: a developer with a specific blocker gets a written answer from someone whose public work shows they have done it. `[INTERVIEW]` `2026-09-01-*`, `2026-09-02-interview-freelancer-react.md`
- That the answer comes in a booked session, hours ahead, is the team's decision, not what the interviewees asked for; the freelancer also wanted a call for estimates, which N01 excludes. `[DOCUMENT]` D02, N01
- Primary metric, baseline today, threshold, date: not set – the first signal to watch is mentor recruitment (Kill criteria); no baseline exists.
- What must not get worse: nothing from a session is published without the mentee's approval (R02).

## Scope

- **Now:** the booking-and-session job end to end: mentor sets slots and prices and gets a share link (R07, D03); mentee finds the mentor through the link or the opt-in list, books a slot with the question and prepays (R01, R03); mentor accepts (R05); the text session; cancellation, no-show and refunds (R04); optional private note (R06).
- **Later:** the mentor knowledge vault, MCP access, subscriptions, async questions with a 24-hour answer, on-demand help within the hour (D01, D02).
- **Not doing:** see Non-goals.

## Domain glossary

| Term | Meaning | Owned by | Visible to |
|---|---|---|---|
| Slot | a time the mentor publishes as bookable for a 25- or 50-minute session | mentor | mentee |
| Booking | a slot reserved and prepaid by a mentee, with their question | mentee | mentee, mentor |
| Acceptance | the mentor's yes or no to a booking's question (R05) | mentor | both |
| Session | the 25- or 50-minute text conversation at the booked time | both | both |
| Session note | the mentor's optional short note after a session, approved by the mentee (R06) | mentor writes, mentee approves | mentee only |
| Share link | the mentor's personal booking link (D03) | mentor | anyone with the link |
| Public list | mentors who opted in to be listed (D03) | platform | everyone |

## Key flows

- Current state: the developer checks code and docs, asks friends and communities, judges a stranger by profile or GitHub, waits for a reply, arranges time and payment by hand, explains the context in the session, and keeps no notes afterwards. `[DOCUMENT]` `2026-09-02-miro-board-journey-current-state.md` (restating `2026-08-20-interview-working-dev.md`)
- Asking an AI assistant is a common current alternative: 38 of 54 survey respondents did it the last time they were stuck. `[DATA]` `2026-09-04-survey-discord-willingness-to-pay.md`
- Future state, booking and session (1.0), decided steps: (1) the mentor publishes slots and prices (R07); (2) the mentee opens the mentor's link or the list (D03); (3) picks a slot, writes the question, prepays (R01, R03); (4) the mentor accepts or declines until 12 hours before (R05); (5) text session; (6) cancellation, no-show and refund per R04; (7) optional note approved by the mentee (R06). How a mentee proves a mentor no-show is not decided (Q03). `[DOCUMENT]` D01–D08

## Business rules

| Id | Rule | Applies to | Source | Status | Review by | Required path to change | Owner | Supersedes |
|---|---|---|---|---|---|---|---|---|
| R01 | Sessions are text and last 25 or 50 minutes. | booking, session | `[DOCUMENT]` workshop 2026-08-26; N01 | active | unknown | superseding row approved by the owner | Arkadiusz | none |
| R02 | Nothing from a session is published without the mentee's approval. | session note | `[DOCUMENT]` workshop 2026-08-26 | active | unknown | superseding row approved by the owner | Arkadiusz | none |
| R03 | The mentee pays when booking (prepayment), through Stripe. | booking | `[DOCUMENT]` D01; workshop constraint | active | unknown | superseding row approved by the owner | Arkadiusz | none |
| R04 | Free cancellation until 12 h before; a later cancellation or a mentee no-show pays the mentor; a mentor no-show refunds the mentee in full the same day. | booking, payment | `[DOCUMENT]` D04 | active | when no-show disputes appear | superseding row approved by the owner | Arkadiusz | none |
| R05 | The mentor accepts or declines the question no later than 12 h before the session; no decision expires the booking with a full refund; a decline refunds in full. | booking | `[DOCUMENT]` D05, D07 | active | unknown | superseding row approved by the owner | Arkadiusz | none |
| R06 | The session note is optional, written by the mentor, approved by and visible only to the mentee. | session note | `[DOCUMENT]` D06 | active | when the vault is planned | superseding row approved by the owner | Arkadiusz | none |
| R07 | Each mentor sets the prices of their 25- and 50-minute sessions; the platform commission is a setting (Q01). | mentor, payment | `[DOCUMENT]` D08 | active | before launch | superseding row approved by the owner | Arkadiusz | none |
| R08 | A mentor appears on the public list only after opting in; every mentor has a share link. | mentor | `[DOCUMENT]` D03 | active | unknown | superseding row approved by the owner | Arkadiusz | none |

## Non-goals

| Id | We are not building | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|
| N01 | Video calls | sessions are text; "text is fine, faster" | founder A (Oliwia) | active | unknown | superseding record by founder A | `[DOCUMENT]` `decisions/N01-no-video.md` | none |
| N02 | Ratings or review scores | a link to public work instead; "my GitHub is my profile" | founder A (Oliwia) | active | unknown | superseding record by founder A | `[DOCUMENT]` `decisions/N02-no-ratings.md` | none |
| N03 | Help on demand within the hour in 1.0 | 1.0 books slots | Arkadiusz | active | after the first bookings (A01) | superseding row approved by the owner | `[DOCUMENT]` D02 | none |

## Decisions

| Id | Date | Decision | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D01 | 2026-10-19 | 1.0 is paid text sessions; vault, MCP, subscriptions are Later | mentees asked for fast help from a person, not saved answers; fits 25 h of build; alternative considered: the vault first (workshop question); agent's recommendation accepted | Arkadiusz | active | when sessions show demand or mentors decline for lack of a vault | superseding row approved by the owner | `[DOCUMENT]` `decisions/D01-scope-paid-text-sessions.md` | none |
| D02 | 2026-10-19 | Book a slot in the mentor's calendar | simpler; no on-call mentors; alternative considered: help within the hour; owner's choice | Arkadiusz | active | after the first bookings (A01) | superseding row approved by the owner | `[DOCUMENT]` `decisions/D02-booked-slots.md` | none |
| D03 | 2026-10-19 | Share link for every mentor; public list by opt-in | one mentor refuses a list; a mentee gave up searching; agent's recommendation accepted | Arkadiusz | active | unknown | superseding row approved by the owner | `[DOCUMENT]` `decisions/D03-share-link-and-opt-in-listing.md` | none |
| D04 | 2026-10-19 | Adopt R04 | mentor and mentee asked for opposite protections; 12 h from Preply; agent's recommendation accepted | Arkadiusz | active | when no-show disputes appear | superseding row approved by the owner | `[DOCUMENT]` `decisions/D04-cancellation-and-no-show.md` | none |
| D05 | 2026-10-19 | The mentor accepts the question (R05) | two mentors want the question first; owner's choice over automatic confirmation | Arkadiusz | active | unknown | superseding row approved by the owner | `[DOCUMENT]` `decisions/D05-mentor-accepts-the-question.md` | none |
| D06 | 2026-10-19 | Adopt R06 | mentors write notes only with consent and not for free; mentees keep answers themselves; agent's recommendation accepted | Arkadiusz | active | when the vault is planned | superseding row approved by the owner | `[DOCUMENT]` `decisions/D06-optional-private-session-note.md` | none |
| D07 | 2026-10-19 | Acceptance closes 12 h before the session (R05) | the same point as free cancellation; owner's choice | Arkadiusz | active | unknown | superseding row approved by the owner | `[DOCUMENT]` `decisions/D07-acceptance-deadline.md` | none |
| D08 | 2026-10-19 | Adopt R07; commission decided before launch | mentors want to set prices; agent's recommendation accepted | Arkadiusz | active | before launch | superseding row approved by the owner | `[DOCUMENT]` `decisions/D08-mentor-sets-price.md` | none |
| D09 | 2026-10-19 | Answers Q02: slots starting less than 12 h ahead are not bookable in 1.0 | keeps R05/D07 intact; simplest; agent's recommendation accepted | Arkadiusz | active | after the first bookings (A01) | superseding row approved by the owner | `[DOCUMENT]` `decisions/D09-no-bookings-within-12-hours.md` | none |
| D10 | 2026-10-19 | Sign-in is email + password only; GitHub is a public-work link | no new provider; standards define the password path; agent's recommendation accepted | Arkadiusz | active | if sign-up drop-off appears | superseding row approved by the owner | `[DOCUMENT]` `decisions/D10-email-password-sign-in.md` | none |
| D11 | 2026-10-19 | Mentors join only by an admin-issued invitation; admins are the founders; mentees self-register | matches the recruitment test (A02); agent's recommendation accepted | Arkadiusz | active | when open mentor sign-up is wanted | superseding row approved by the owner | `[DOCUMENT]` `decisions/D11-mentors-join-by-invitation.md` | none |
| D12 | 2026-10-19 | Prices in PLN only, stored in grosze | evidence comes from a Polish community; agent's recommendation accepted | Arkadiusz | active | when foreign users appear | superseding row approved by the owner | `[DOCUMENT]` `decisions/D12-prices-in-pln.md` | none |

## Riskiest assumptions

| Id | Assumption | Importance | Evidence today | If false | Smallest test | Owner | By when | Result |
|---|---|---|---|---|---|---|---|---|
| A01 | A developer with an urgent blocker will book the nearest available slot rather than look elsewhere. `[ASSUMPTION]` origin: D02 | high | three accounts asked for help within 20 minutes, within the hour or the same day; one said he gives up when booking takes more than five minutes (paraphrase) | a booked-slot product misses the urgent case; revisit D02 | with the first mentors live, record for each attempted booking how far away the nearest slot was and whether the developer booked or left | Arkadiusz | unknown | accepted untested (D02) |
| A02 | Senior engineers invited from the founders' list will join and publish paid availability. `[ASSUMPTION]` origin: board channel plan | high | two of three mentor interviews said "maybe / why not" to a 25-minute text session; one said she would forget about it after a month without bookings (paraphrase); 29 of 50 listed names have a warm contact; nobody contacted | no supply; stop or change direction (Kill criteria) | invite the first batch from the 29 warm contacts and record who joins and publishes slots | Arkadiusz | unknown | untested |
| A03 | Developers will actually pay for a booked slot, not only say they would. `[ASSUMPTION]` origin: survey reading | high | 37 of 54 said they would pay something for an answer "within an hour, over text" – a different offer from a slot booked hours ahead; 3 of 54 have ever paid anyone; interview prices were a shrug | sessions do not earn; revisit D01 | count prepaid bookings once mentors are live | Arkadiusz | unknown | untested |
| A04 | Mentors can bring their own audience through the share link. `[ASSUMPTION]` origin: board channels | medium | 16 of 50 listed mentors have an audience, 23 unknown; one mentor brings people "only if there is income" | the opt-in list must carry discovery | record bookings by entry point (link or list) | Arkadiusz | unknown | untested |

## Kill criteria

Stop or change direction when the invited mentors do not join or do not publish availability (A02). The number of invitations, the threshold and the date are not set yet; the decider is Arkadiusz. This is the owner's stated signal, not an observed result.

## Hypotheses to test

None – no synthetic walkthrough has been run.

## Open questions

| Id | Question | Blocking | Who can answer | Status |
|---|---|---|---|---|
| Q01 | What commission does the platform take? | yes – launch (payment split), not the build | owner | open |
| Q02 | How is a booking made less than 12 hours ahead handled, given that acceptance closes 12 hours before (R05)? Without an answer 1.0 cannot help sooner than about 12 hours after booking. | yes – the core booking job (any same-day help) | owner | answered 2026-10-19 by D09 – slots within 12 h are not bookable; same-day help is not served in 1.0 |
| Q03 | How is a mentor no-show established for the same-day refund (R04)? | yes – the refund part of R04 | owner | open |
| Q04 | Terms of service and data processing: who owns them, given that legal has nobody assigned? | yes – launch | owner (founder A by default per the RACI note) | open |
| Q05 | When does a mentor give payout details – one mentor refuses before the first booking? | no – only the payout onboarding step | owner | open |
| Q06 | Who pays when the developer is employed – the developer or the employer – and does the mentor need to issue invoices ("faktury. nie")? | no for 1.0 booking; yes for payouts and tax | owner, then legal | open |

## Definition of Ready addendum (own)

Problems and Target group rest on seven interviews, one Discord export and one survey from a single community – real accounts, but few and self-selected; frequency and willingness to pay are not established. Now is decided (D01–D12); Q02 is answered by D09 (no bookings within 12 h); Q01, Q03, Q04 must be answered before launch, and Q03 before the booking rules are specified in full. A01 is accepted untested by the owner (D02); A02 and A03 are untested. Ready for: implementation planning of the booking-and-session scope, without same-day help (D09); demand is not tested before the build (A01, A03 are observed only once mentors are live); not ready for launch.

## Collection plan

### Will the invited mentors join and publish paid availability?

- What decision or work needs it: the Kill criteria and A02; whether to launch at all
- Who can answer it: the 29 senior engineers on the founders' list with a warm contact
- How: send the invitation to a first batch and record for each: joined or declined (with the reason), the conditions they set (who else is on the platform, a first booking from someone they know, income rather than only a calendar), and whether they are still active after a month without bookings. Whether "published slots" can be observed before the product exists is a question for the owner.
- Owner and by when: Arkadiusz; date unknown
- Template: `.ai/specs/research/templates/data-request.md`

### Do developers book and pay for the nearest slot?

- What decision or work needs it: A01, A03; D02 and D01 review
- Who can answer it: developers reaching the first live mentors
- How: record each booking attempt: entry point, distance to the nearest slot, booked or left, paid or not
- Owner and by when: Arkadiusz; after the first mentors are live
- Template: `.ai/specs/research/templates/data-request.md`
