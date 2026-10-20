import { describe, expect, it } from "vitest";
import { formatDateTime, formatPrice, formatPriceInput, formatRelative, formatUtcOffset, formatZoneLabel, parsePrice } from "./format";

const NBSP = " ";

describe("formatPrice", () => {
  it("formats grosze as the currency code and two decimals, joined by a no-break space", () => {
    expect(formatPrice(18000, "PLN")).toBe(`PLN${NBSP}180.00`);
  });

  it("keeps grosze and groups thousands", () => {
    expect(formatPrice(123456750, "PLN")).toBe(`PLN${NBSP}1,234,567.50`);
  });
});

describe("formatDateTime", () => {
  it("shows weekday, day, month and a 24-hour time in the given zone", () => {
    expect(formatDateTime("2026-11-04T17:00:00Z", "Europe/Warsaw")).toBe("Wed 4 Nov, 18:00");
  });

  it("shows the same instant differently in another zone", () => {
    expect(formatDateTime("2026-11-04T17:00:00Z", "America/New_York")).toBe("Wed 4 Nov, 12:00");
  });
});

describe("formatUtcOffset and formatZoneLabel", () => {
  it("follows daylight saving time", () => {
    expect(formatUtcOffset("Europe/Warsaw", new Date("2026-07-01T12:00:00Z"))).toBe("UTC+2");
    expect(formatUtcOffset("Europe/Warsaw", new Date("2026-11-04T12:00:00Z"))).toBe("UTC+1");
  });

  it("shows minutes only when the offset has them, and negative offsets", () => {
    expect(formatUtcOffset("Asia/Kolkata", new Date("2026-11-04T12:00:00Z"))).toBe("UTC+5:30");
    expect(formatUtcOffset("America/Sao_Paulo", new Date("2026-11-04T12:00:00Z"))).toBe("UTC-3");
  });

  it("shows plain UTC for a zero offset", () => {
    expect(formatUtcOffset("UTC", new Date("2026-11-04T12:00:00Z"))).toBe("UTC");
  });

  it("labels a zone with its name and offset", () => {
    expect(formatZoneLabel("Europe/Warsaw", new Date("2026-11-04T12:00:00Z"))).toBe("Europe/Warsaw, UTC+1");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-11-04T08:00:00Z");

  it("says now within a minute", () => {
    expect(formatRelative("2026-11-04T08:00:40Z", now)).toBe("now");
  });

  it("uses minutes under an hour, rounded down", () => {
    expect(formatRelative("2026-11-04T08:45:59Z", now)).toBe("in 45 min");
  });

  it("uses hours under two days", () => {
    expect(formatRelative("2026-11-04T17:30:00Z", now)).toBe("in 9 h");
    expect(formatRelative("2026-11-05T20:00:00Z", now)).toBe("in 36 h");
  });

  it("uses days from two days on", () => {
    expect(formatRelative("2026-11-07T09:00:00Z", now)).toBe("in 3 days");
  });

  it("describes the past", () => {
    expect(formatRelative("2026-11-04T07:40:00Z", now)).toBe("20 min ago");
  });
});

describe("parsePrice and formatPriceInput", () => {
  it.each([
    ["180", 18000],
    ["180.5", 18050],
    ["180,50", 18050],
    [" 1 200 ", 120000],
    ["0.07", 7],
  ])("reads %j as %i grosze", (text, minor) => {
    expect(parsePrice(text)).toBe(minor);
  });

  it("reads an empty field as not set", () => {
    expect(parsePrice("  ")).toBeNull();
  });

  it.each(["180.505", "-10", "PLN 180", "1.2.3"])("refuses %j", (text) => {
    expect(parsePrice(text)).toBeNaN();
  });

  it("formats a stored price for editing", () => {
    expect(formatPriceInput(18050)).toBe("180.50");
    expect(formatPriceInput(null)).toBe("");
  });
});
