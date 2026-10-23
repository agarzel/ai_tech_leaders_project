import { describe, expect, it } from "vitest";
import { CURRENCY, MENTOR_TAGS, SESSION_LENGTHS } from "./index";

describe("domain constants", () => {
  it("offers 25- and 50-minute sessions", () => {
    expect(SESSION_LENGTHS).toEqual([25, 50]);
  });

  it("prices in PLN only", () => {
    expect(CURRENCY).toBe("PLN");
  });

  it("lists the stack tags a mentor can choose", () => {
    expect(MENTOR_TAGS).toEqual(["TypeScript", "React", "Python", "AI agents"]);
  });
});
