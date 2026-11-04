import { describe, expect, inject, it } from "vitest";
import { Browser } from "./support/browser";

const baseUrl = inject("baseUrl");

describe("security response headers", () => {
  // Scenario: .ai/qa/SECURITY/SECURITY-005-app-responses-carry-security-headers.md
  it("applies the security policy to pages and API responses without browser violations", async () => {
    const expectedHeaders: Record<string, string> = {
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    };

    for (const pathname of ["/", "/login", "/api/health"]) {
      const response = await fetch(new URL(pathname, baseUrl));
      const policy = response.headers.get("content-security-policy");

      expect(policy, `${pathname} should have a CSP`).toBeTruthy();
      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain("connect-src 'self'");
      expect(policy).toContain("frame-ancestors 'none'");

      for (const [name, value] of Object.entries(expectedHeaders)) {
        expect(response.headers.get(name), `${pathname} ${name}`).toBe(value);
      }

      expect(response.headers.get("strict-transport-security"), pathname).toBeNull();
      expect(response.headers.get("x-powered-by"), pathname).toBeNull();
    }

    const browser = new Browser("devmentor-it-security-headers", baseUrl);
    try {
      for (const pathname of ["/", "/login"]) {
        await browser.run("console", "--clear");
        await browser.open(pathname);
        const consoleOutput = await browser.run("console");
        expect(consoleOutput, `${pathname} should not have CSP violations`).not.toMatch(
          /content security policy|violates the following/i,
        );
      }
    } finally {
      await browser.close();
    }
  });
});
