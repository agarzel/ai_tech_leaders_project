# SECURITY-005 – App responses carry security headers

- **Area:** SECURITY · **Priority:** Medium · **Type:** API and UI
- **Rule:** Every app response applies the T-08 browser security policy; production responses additionally apply HSTS (`docs/security/threat-model.md` T-08).
- **Test:** [packages/app/tests/integration/security-headers.int.test.ts](../../../packages/app/tests/integration/security-headers.int.test.ts) › "applies the security policy to pages and API responses without browser violations"

## Given
- The application is running in the integration environment.

## When
- Request `/`, `/login`, and `/api/health` and open `/` and `/login` in the browser.

## Then
- Each response carries the configured CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` disabling camera, microphone, and geolocation.
- Development responses omit HSTS and `X-Powered-By`.
- The browser console reports no CSP violations while loading either page.
- Production responses carry `Strict-Transport-Security`.

## Edge cases not covered here
- HSTS in production (`NODE_ENV=production`) – the suite runs `next dev`, so it is not covered here.
- CSP policies can require updates if the app begins loading scripts, fonts, images, or connections from external origins.
