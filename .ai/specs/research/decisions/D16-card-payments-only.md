# D16 — Card payments only in the booking spec; BLIK and Przelewy24 are a separate decision
- Date, owner: 2026-10-19, Arkadiusz, confirmed on the reviews of `.ai/specs/2026-10-19-booking-and-prepayment.md`
- Context and the options weighed: in PLN, Stripe Checkout can offer BLIK and Przelewy24, which may confirm after `checkout.session.completed`. Options: cards only; model delayed confirmations and keep the slot held until the outcome.
- Decision and why: cards only, so a paid booking is known at once and the hold logic stays simple. Origin: the agent's recommendation after both reviews, accepted by the owner.
- Consequences, and what would make us revisit it: BLIK is common in Poland, so some mentees may abandon Checkout; revisit when abandoned Checkouts or mentee requests show it.
- Status: active
