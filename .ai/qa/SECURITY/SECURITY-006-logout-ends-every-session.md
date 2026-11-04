# SECURITY-006 – Logout ends every session of the account

- **Area:** SECURITY · **Priority:** High · **Type:** API
- **Rule:** logging out (and an operator password reset) revokes every session token issued before it, so a copied or forgotten cookie stops working (threat model T-07; `users.sessions_revoked_at`, `AuthService.authenticate`, route `api/auth/logout`).
- **Test:** [packages/app/tests/integration/session-revocation.int.test.ts](../../../packages/app/tests/integration/session-revocation.int.test.ts) › "refuses the other device's session after a logout and lets it sign in again"

## Given
- One mentee account signed in on two browsers ("laptop" and "phone").
- Positive controls: both read their bookings list (200).

## When
- The laptop logs out.

## Then
- Both browsers' old cookies answer 401.
- A fresh login on the phone works and reads the list again (200).

## Edge cases not covered here
- Password reset through `auth:set-password` (unit-tested in `auth.service.test.ts`).
- A token issued in the same second as the logout stays valid (second-precision `iat`), by design.
