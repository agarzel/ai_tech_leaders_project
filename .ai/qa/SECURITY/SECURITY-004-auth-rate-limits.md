# SECURITY-004: Public auth rate limits

## Scenario

An anonymous visitor cannot create more than ten accounts from one client IP in an hour, and failed logins from one IP do not lock the account for a different IP. A single IP is still capped across login attempts for different email addresses.

## Steps

1. Send ten valid `POST /api/auth/register` requests with unique addresses and the same `x-forwarded-for` value; each receives `201`.
2. Send an eleventh valid registration from that IP; it receives `429 rate_limited`.
3. Register an account, send five invalid login requests for it from IP X, then send a correct login from IP Y; the correct login succeeds.
4. Send failed login requests for distinct addresses until the per-IP cap is reached; the next login attempt from that IP receives `429`.

## Expected result

Registration shares the per-IP hourly limit across mentee and invited mentor registration. Login failure counts are scoped to IP plus normalized email, with an independent per-IP spray cap.

## Automated coverage

`packages/app/tests/integration/auth-rate-limit.int.test.ts`
