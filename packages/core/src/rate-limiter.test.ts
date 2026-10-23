import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limiter";
import { FakeClock } from "./testing/fake-clock";

const MINUTE = 60_000;

function setup(options = { maxAttempts: 5, windowMs: 15 * MINUTE }) {
  const clock = new FakeClock(new Date("2026-01-01T00:00:00Z"));
  return { clock, limiter: new RateLimiter({ clock }, options) };
}

describe("RateLimiter", () => {
  it("allows a key with no recorded attempts", () => {
    const { limiter } = setup();

    expect(limiter.check("a@example.com")).toEqual({ allowed: true, resetAt: null });
  });

  it("allows attempts below the maximum and reports when the window resets", () => {
    const { limiter } = setup();

    for (let i = 0; i < 4; i++) limiter.record("a@example.com");

    const result = limiter.check("a@example.com");
    expect(result.allowed).toBe(true);
    expect(result.resetAt?.toISOString()).toBe("2026-01-01T00:15:00.000Z");
  });

  it("refuses once the maximum is reached", () => {
    const { limiter } = setup();

    for (let i = 0; i < 5; i++) limiter.record("a@example.com");

    expect(limiter.check("a@example.com").allowed).toBe(false);
  });

  it("keeps keys independent", () => {
    const { limiter } = setup({ maxAttempts: 1, windowMs: MINUTE });

    limiter.record("a@example.com");

    expect(limiter.check("a@example.com").allowed).toBe(false);
    expect(limiter.check("b@example.com").allowed).toBe(true);
  });

  it("does not extend the window when more attempts are recorded", () => {
    const { clock, limiter } = setup({ maxAttempts: 2, windowMs: 10 * MINUTE });

    limiter.record("a@example.com");
    clock.advance(5 * MINUTE);
    limiter.record("a@example.com");

    expect(limiter.check("a@example.com").resetAt?.toISOString()).toBe("2026-01-01T00:10:00.000Z");
  });

  it("allows again once the window has passed", () => {
    const { clock, limiter } = setup();
    for (let i = 0; i < 5; i++) limiter.record("a@example.com");

    clock.advance(15 * MINUTE);

    expect(limiter.check("a@example.com")).toEqual({ allowed: true, resetAt: null });
  });

  it("starts a fresh window after the previous one expired", () => {
    const { clock, limiter } = setup({ maxAttempts: 1, windowMs: MINUTE });
    limiter.record("a@example.com");
    clock.advance(MINUTE);

    limiter.record("a@example.com");

    const result = limiter.check("a@example.com");
    expect(result.allowed).toBe(false);
    expect(result.resetAt?.toISOString()).toBe("2026-01-01T00:02:00.000Z");
  });

  it("forgets a key on reset", () => {
    const { limiter } = setup({ maxAttempts: 1, windowMs: MINUTE });
    limiter.record("a@example.com");

    limiter.reset("a@example.com");

    expect(limiter.check("a@example.com").allowed).toBe(true);
  });
});
