import { describe, expect, it } from "vitest";
import { UnauthorizedError } from "./errors";
import { verifySweepSecret } from "./sweep-auth";

const SECRET = "s".repeat(40);

describe("verifySweepSecret", () => {
  it("accepts the configured secret", () => {
    expect(() => verifySweepSecret(SECRET, SECRET)).not.toThrow();
  });

  it.each([null, undefined, ""])("refuses a missing header (%s)", (header) => {
    expect(() => verifySweepSecret(header, SECRET)).toThrow(UnauthorizedError);
  });

  it("refuses a wrong value of the same length", () => {
    expect(() => verifySweepSecret("t".repeat(40), SECRET)).toThrow(UnauthorizedError);
  });

  it("refuses a wrong value of another length", () => {
    expect(() => verifySweepSecret("short", SECRET)).toThrow(UnauthorizedError);
  });

  it("refuses everything when the configured secret is too short, even a matching header", () => {
    expect(() => verifySweepSecret("short-secret", "short-secret")).toThrow(UnauthorizedError);
    expect(() => verifySweepSecret("", "")).toThrow(UnauthorizedError);
  });
});
