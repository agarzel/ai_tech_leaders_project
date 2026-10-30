# Integration test best practices

Source: AI Tech Leaders, lesson 12 ("Best practices pisania scenariuszy testów integracyjnych"), adapted to DevMentor.

1. **Test behaviour, not implementation.** Assert what a user or another system sees ("the booking is Confirmed"), not that a method was called. A correct refactoring must not break the test.
2. **One test, one business case.** Many steps are fine; one goal. Payment, cancellation and refund are three tests.
3. **Given – When – Then.** Write the start state, the action and the expected result; the `it` name and the scenario file follow it.
4. **Deterministic.** No unseeded random data, no dependence on the current date, no shared data between tests, no `wait(5000)`, no order dependence, no unstable external services. Wait for a concrete state (`waitForText`), move time with data, not with sleeps.
5. **Independent.** The test creates its own data, runs, checks, and cleans up if needed. Never assume another test created a user or a booking.
6. **Shortest setup path.** Prepare data through the API or the test layer; go through the full UI only when that path is the subject of the test.
7. **Check the result at the right level** – API reply, UI, database row, event, the controlled external call – only those that prove this case.
8. **Control external integrations.** Use the fake gateway, mocks or the provider's test mode, and check the request the system sent (amount, id). Do not mock your own components whose cooperation is under test.
9. **Positive, negative and edge cases.** Wrong data, missing permission, missing resource, conflict or repeat, timeout, external error, boundary values.
10. **Idempotency.** Sending the same webhook or request again must not apply the operation twice.
11. **Stable selectors.** Role and accessible name, then label, then visible text, then `data-testid`. Never structure- or style-based selectors.
12. **Specific assertions.** Check the exact status code, status, amount or message, not just "ok".
13. **No hidden steps in broad helpers.** Small single-purpose helpers are fine; reading the test must still tell which steps the user took.
14. **Name = condition + result.** "refuses a payment when the webhook signature is invalid", not "payment test 3".
15. **Review what the AI wrote.** The expected result comes from the spec, not from the model's guess; read the test, check it by hand, and confirm it tests the right behaviour. A green check is not enough.
