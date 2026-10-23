import { describe, expect, it } from "vitest";
import { realClock } from "./clock";
import { FakeClock } from "./testing/fake-clock";

describe("realClock", () => {
  it("returns the current time", () => {
    const before = Date.now();
    const now = realClock.now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});

describe("FakeClock", () => {
  it("returns the configured time and does not move on its own", () => {
    const clock = new FakeClock(new Date("2026-01-01T00:00:00Z"));

    expect(clock.now().toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(clock.now().toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("moves forward by the given milliseconds", () => {
    const clock = new FakeClock(new Date("2026-01-01T00:00:00Z"));

    clock.advance(1500);

    expect(clock.now().toISOString()).toBe("2026-01-01T00:00:01.500Z");
  });

  it("returns a copy so callers cannot mutate the clock", () => {
    const clock = new FakeClock(new Date("2026-01-01T00:00:00Z"));

    clock.now().setFullYear(1999);

    expect(clock.now().getUTCFullYear()).toBe(2026);
  });
});
