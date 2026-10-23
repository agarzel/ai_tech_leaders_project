import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "./session-cookie";

describe("sessionCookieOptions", () => {
  it("is httpOnly, lax, site-wide and lasts as long as the session", () => {
    expect(sessionCookieOptions("development")).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  });

  it("is secure in production", () => {
    expect(sessionCookieOptions("production").secure).toBe(true);
  });

  it("uses one cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("devmentor_session");
  });
});
