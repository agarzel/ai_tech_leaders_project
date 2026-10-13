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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses a valid environment", async () => {
    const getEnv = await loadGetEnv();

    expect(getEnv()).toEqual({
      NODE_ENV: "test",
      DATABASE_URL: "postgres://devmentor:secret@localhost:5432/devmentor",
      LOG_LEVEL: "debug",
    });
  });

  it("applies defaults for optional variables", async () => {
    vi.stubEnv("NODE_ENV", undefined);
    vi.stubEnv("LOG_LEVEL", undefined);
    const getEnv = await loadGetEnv();

    expect(getEnv()).toMatchObject({ NODE_ENV: "development", LOG_LEVEL: "info" });
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
