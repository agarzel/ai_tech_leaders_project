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
});
