import { describe, expect, it, vi } from "vitest";
import { getEnv } from "../config/env";
import { requireAdmin } from "./auth";
import { ForbiddenError } from "./errors";

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
