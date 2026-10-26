import { describe, expect, it } from "vitest";
import { BOOKING_ENTRY_POINTS, BOOKING_LEAD_TIME_HOURS, CURRENCY, MENTOR_TAGS, SESSION_LENGTHS, SLOT_BLOCK_MINUTES } from "./index";

describe("domain constants", () => {
  it("offers 25- and 50-minute sessions", () => {
    expect(SESSION_LENGTHS).toEqual([25, 50]);
  });

  it("blocks 50 minutes per slot", () => {
    expect(SLOT_BLOCK_MINUTES).toBe(50);
  });

  it("requires a 24-hour booking lead time (D13)", () => {
    expect(BOOKING_LEAD_TIME_HOURS).toBe(24);
  });

  it("prices in PLN only", () => {
    expect(CURRENCY).toBe("PLN");
  });

  it("records where a booking came from", () => {
    expect(BOOKING_ENTRY_POINTS).toEqual(["link", "list", "unknown"]);
  });

  it("lists the stack tags a mentor can choose", () => {
    expect(MENTOR_TAGS).toEqual(["TypeScript", "React", "Python", "AI agents"]);
  });
});
