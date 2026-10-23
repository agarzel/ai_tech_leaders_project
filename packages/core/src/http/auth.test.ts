import { describe, expect, it, vi } from "vitest";
import { getEnv } from "../config/env";
import { assertOwner, requireAdmin, requireRole, requireSession, type Session } from "./auth";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { SESSION_COOKIE_NAME } from "./session-cookie";

vi.mock("../config/env", () => ({ getEnv: vi.fn() }));

function withNodeEnv(nodeEnv: "development" | "test" | "production") {
  vi.mocked(getEnv).mockReturnValue({ NODE_ENV: nodeEnv, DATABASE_URL: "postgres://x", AUTH_SECRET: "x".repeat(32), LOG_LEVEL: "info" });
}

describe("requireAdmin (temporary, until auth exists)", () => {
  it.each(["development", "test"] as const)("allows access in %s", (nodeEnv) => {
    withNodeEnv(nodeEnv);

    expect(() => requireAdmin()).not.toThrow();
  });

  it("fails closed in production", () => {
    withNodeEnv("production");

    expect(() => requireAdmin()).toThrow(ForbiddenError);
  });
});

const session: Session = { id: "u1", email: "ada@example.com", name: "Ada", role: "mentor" };

describe("requireSession", () => {
  function requestWithCookie(cookie?: string) {
    return new Request("http://localhost/api/x", cookie ? { headers: { cookie } } : {});
  }

  it("returns the user the auth service authenticates from the session cookie", async () => {
    const authService = { authenticate: vi.fn().mockResolvedValue(session) };

    const result = await requireSession(requestWithCookie(`theme=dark; ${SESSION_COOKIE_NAME}=tok.en; other=1`), authService);

    expect(result).toBe(session);
    expect(authService.authenticate).toHaveBeenCalledWith("tok.en");
  });

  it.each([
    ["no cookie header", undefined],
    ["other cookies only", "theme=dark"],
    ["an empty session cookie", `${SESSION_COOKIE_NAME}=`],
  ])("rejects a request with %s", async (_label, cookie) => {
    const authService = { authenticate: vi.fn() };

    await expect(requireSession(requestWithCookie(cookie), authService)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(authService.authenticate).not.toHaveBeenCalled();
  });

  it("propagates the rejection when the token is invalid", async () => {
    const authService = { authenticate: vi.fn().mockRejectedValue(new UnauthorizedError()) };

    await expect(requireSession(requestWithCookie(`${SESSION_COOKIE_NAME}=bad`), authService)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("requireRole", () => {
  it("allows a session whose role is listed", () => {
    expect(() => requireRole(session, "admin", "mentor")).not.toThrow();
  });

  it("forbids a session whose role is not listed", () => {
    expect(() => requireRole(session, "admin")).toThrow(ForbiddenError);
  });
});

describe("assertOwner", () => {
  it("allows the owner", () => {
    expect(() => assertOwner(session, "u1")).not.toThrow();
  });

  it("forbids anyone else, admins included", () => {
    expect(() => assertOwner({ ...session, role: "admin" }, "u2")).toThrow(ForbiddenError);
  });
});
