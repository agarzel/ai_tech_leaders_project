import { Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

function capture() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(JSON.parse(chunk.toString()));
      callback();
    },
  });
  return { lines, stream };
}

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redacts secrets at the top level and one level deep", () => {
    const { lines, stream } = capture();
    const logger = createLogger(stream);

    logger.info({ password: "p", token: "t", user: { jwt: "j", cookie: "c", name: "Ada" } }, "login");

    expect(lines[0]).toMatchObject({
      msg: "login",
      password: "[redacted]",
      token: "[redacted]",
      user: { jwt: "[redacted]", cookie: "[redacted]", name: "Ada" },
    });
  });

  it("redacts AUTH_SECRET and authSecret", () => {
    const { lines, stream } = capture();
    const logger = createLogger(stream);

    logger.info({ AUTH_SECRET: "a", config: { authSecret: "b", name: "x" } }, "boot");

    expect(lines[0]).toMatchObject({ AUTH_SECRET: "[redacted]", config: { authSecret: "[redacted]", name: "x" } });
  });

  it("redacts the payment and sweep secrets", () => {
    const { lines, stream } = capture();
    const logger = createLogger(stream);

    logger.info(
      { STRIPE_SECRET_KEY: "a", config: { STRIPE_WEBHOOK_SECRET: "b", SWEEP_SECRET: "c", sweepSecret: "d", stripeSecretKey: "e", stripeWebhookSecret: "f", name: "x" } },
      "boot",
    );

    expect(lines[0]).toMatchObject({
      STRIPE_SECRET_KEY: "[redacted]",
      config: {
        STRIPE_WEBHOOK_SECRET: "[redacted]",
        SWEEP_SECRET: "[redacted]",
        sweepSecret: "[redacted]",
        stripeSecretKey: "[redacted]",
        stripeWebhookSecret: "[redacted]",
        name: "x",
      },
    });
  });

  it("uses LOG_LEVEL", () => {
    vi.stubEnv("LOG_LEVEL", "warn");

    expect(createLogger().level).toBe("warn");
  });

  it("defaults to info", () => {
    vi.stubEnv("LOG_LEVEL", undefined);

    expect(createLogger().level).toBe("info");
  });
});
