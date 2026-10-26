import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadGetEnv() {
  vi.resetModules();
  return (await import("./env")).getEnv;
}

describe("getEnv", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgres://devmentor:secret@localhost:5432/devmentor");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LOG_LEVEL", "debug");
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    vi.stubEnv("PAYMENTS_PROVIDER", "fake");
    vi.stubEnv("STRIPE_SECRET_KEY", undefined);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", undefined);
    vi.stubEnv("SWEEP_SECRET", "w".repeat(32));
    vi.stubEnv("APP_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses a valid environment", async () => {
    const getEnv = await loadGetEnv();

    expect(getEnv()).toEqual({
      NODE_ENV: "test",
      DATABASE_URL: "postgres://devmentor:secret@localhost:5432/devmentor",
      AUTH_SECRET: "a".repeat(32),
      LOG_LEVEL: "debug",
      PAYMENTS_PROVIDER: "fake",
      SWEEP_SECRET: "w".repeat(32),
      APP_URL: "http://localhost:3000",
    });
  });

  it("applies defaults for optional variables", async () => {
    vi.stubEnv("NODE_ENV", undefined);
    vi.stubEnv("LOG_LEVEL", undefined);
    const getEnv = await loadGetEnv();

    expect(getEnv()).toMatchObject({ NODE_ENV: "development", LOG_LEVEL: "info" });
  });

  it("accepts an AUTH_SECRET of exactly 32 characters", async () => {
    vi.stubEnv("AUTH_SECRET", "s".repeat(32));
    const getEnv = await loadGetEnv();

    expect(getEnv().AUTH_SECRET).toBe("s".repeat(32));
  });

  it("rejects a missing AUTH_SECRET", async () => {
    vi.stubEnv("AUTH_SECRET", undefined);
    const getEnv = await loadGetEnv();

    expect(() => getEnv()).toThrow(/AUTH_SECRET/);
  });

  it("rejects an AUTH_SECRET shorter than 32 characters without printing it", async () => {
    vi.stubEnv("AUTH_SECRET", "short-secret-value-31-character");
    const getEnv = await loadGetEnv();

    expect(() => getEnv()).toThrow(/AUTH_SECRET/);
    expect(() => getEnv()).not.toThrow(/short-secret-value/);
  });

  it("caches the parsed environment", async () => {
    const getEnv = await loadGetEnv();
    const first = getEnv();

    vi.stubEnv("LOG_LEVEL", "error");

    expect(getEnv()).toBe(first);
  });

  it("throws listing the invalid variables without printing their values", async () => {
    vi.stubEnv("DATABASE_URL", "not a url with secret-value");
    vi.stubEnv("LOG_LEVEL", "loud");
    const getEnv = await loadGetEnv();

    expect(() => getEnv()).toThrow(/Invalid environment variables:[\s\S]*DATABASE_URL[\s\S]*LOG_LEVEL/);
    expect(() => getEnv()).not.toThrow(/secret-value/);
  });

  describe("payments", () => {
    it("requires PAYMENTS_PROVIDER, with no default", async () => {
      vi.stubEnv("PAYMENTS_PROVIDER", undefined);
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(/PAYMENTS_PROVIDER/);
    });

    it("rejects an unknown provider", async () => {
      vi.stubEnv("PAYMENTS_PROVIDER", "paypal");
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(/PAYMENTS_PROVIDER/);
    });

    it("accepts the stripe provider with both Stripe keys", async () => {
      vi.stubEnv("PAYMENTS_PROVIDER", "stripe");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_value");
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_value");
      const getEnv = await loadGetEnv();

      expect(getEnv()).toMatchObject({ PAYMENTS_PROVIDER: "stripe", STRIPE_SECRET_KEY: "sk_test_value" });
    });

    it.each(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"])("requires %s when the provider is stripe", async (name) => {
      vi.stubEnv("PAYMENTS_PROVIDER", "stripe");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_value");
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_value");
      vi.stubEnv(name, undefined);
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(new RegExp(`${name}: required when PAYMENTS_PROVIDER is stripe`));
    });

    it("refuses the fake provider in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(/PAYMENTS_PROVIDER: the fake provider is refused in production/);
    });

    it("allows the stripe provider in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("PAYMENTS_PROVIDER", "stripe");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_value");
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_value");
      const getEnv = await loadGetEnv();

      expect(getEnv().PAYMENTS_PROVIDER).toBe("stripe");
    });

    it("requires a SWEEP_SECRET of at least 32 characters without printing it", async () => {
      vi.stubEnv("SWEEP_SECRET", "short-sweep-value");
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(/SWEEP_SECRET/);
      expect(() => getEnv()).not.toThrow(/short-sweep-value/);
    });

    it("rejects a missing SWEEP_SECRET", async () => {
      vi.stubEnv("SWEEP_SECRET", undefined);
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(/SWEEP_SECRET/);
    });

    it.each([undefined, "not a url", "ftp://example.com"])("rejects APP_URL %s", async (value) => {
      vi.stubEnv("APP_URL", value);
      const getEnv = await loadGetEnv();

      expect(() => getEnv()).toThrow(/APP_URL/);
    });
  });
});
