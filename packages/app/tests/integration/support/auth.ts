import { inject } from "vitest";
import type { Browser } from "./browser";

/** Roles with a known account in the integration database (see `global-setup.ts`). */
export type TestRole = "admin";

/**
 * Signs the browser session in through the real `/login` page (task 1.6 – not available before it).
 * Call it once per test file, before any page that needs a session is opened; the cookie stays in the session.
 */
export async function loginAs(browser: Browser, role: TestRole) {
  const { email, password } = inject("accounts")[role];

  await browser.open("/login");
  await browser.fill("Email", email);
  await browser.fill("Password", password);
  await browser.click("button", "Sign in");
  // Leaving /login means the server accepted the credentials and set the session cookie.
  await browser.run("wait", "--fn", "!location.pathname.startsWith('/login')");
}
