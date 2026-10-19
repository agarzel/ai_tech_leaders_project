import { describe, expect, it, vi } from "vitest";
import { browserTimeZone, localToUtc, offsetAt } from "./time";

describe("localToUtc", () => {
  it("converts a regular local time to UTC (winter, UTC+1)", () => {
    expect(localToUtc("2026-11-04", "18:00", "Europe/Warsaw")).toEqual({
      ok: true,
      iso: "2026-11-04T17:00:00.000Z",
      ambiguous: false,
    });
  });

  it("converts a regular local time to UTC (summer, UTC+2)", () => {
    expect(localToUtc("2026-07-01", "09:15", "Europe/Warsaw")).toEqual({
      ok: true,
      iso: "2026-07-01T07:15:00.000Z",
      ambiguous: false,
    });
  });

  it("refuses a time skipped by the spring-forward change", () => {
    // Europe/Warsaw jumps from 02:00 to 03:00 on 29 March 2026.
    expect(localToUtc("2026-03-29", "02:30", "Europe/Warsaw")).toEqual({ ok: false, reason: "nonexistent" });
  });

  it("picks the first occurrence of a time repeated by the fall-back change", () => {
    // Europe/Warsaw goes back from 03:00 to 02:00 on 25 October 2026: 02:30 happens at UTC+2, then at UTC+1.
    expect(localToUtc("2026-10-25", "02:30", "Europe/Warsaw")).toEqual({
      ok: true,
      iso: "2026-10-25T00:30:00.000Z",
      ambiguous: true,
    });
  });

  it("works for zones without daylight saving time", () => {
    expect(localToUtc("2026-11-04", "18:00", "UTC")).toEqual({ ok: true, iso: "2026-11-04T18:00:00.000Z", ambiguous: false });
  });

  it.each([
    ["not a date", "2026-11-4", "18:00"],
    ["not a time", "2026-11-04", "6pm"],
    ["a day that does not exist", "2026-02-30", "18:00"],
    ["an hour that does not exist", "2026-11-04", "24:00"],
  ])("refuses %s", (_name, date, time) => {
    expect(localToUtc(date, time, "Europe/Warsaw")).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("offsetAt", () => {
  it("returns the zone offset in milliseconds", () => {
    expect(offsetAt(Date.parse("2026-11-04T12:00:00Z"), "Europe/Warsaw")).toBe(60 * 60_000);
    expect(offsetAt(Date.parse("2026-11-04T12:00:30Z"), "America/New_York")).toBe(-5 * 60 * 60_000);
  });
});

describe("browserTimeZone", () => {
  it("returns the zone the browser resolves", () => {
    const spy = vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "Europe/Warsaw",
    } as Intl.ResolvedDateTimeFormatOptions);

    expect(browserTimeZone()).toBe("Europe/Warsaw");
    spy.mockRestore();
  });
});
