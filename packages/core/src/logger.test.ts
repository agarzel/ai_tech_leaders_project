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

  it("uses LOG_LEVEL", () => {
    vi.stubEnv("LOG_LEVEL", "warn");

    expect(createLogger().level).toBe("warn");
  });

  it("defaults to info", () => {
    vi.stubEnv("LOG_LEVEL", undefined);

    expect(createLogger().level).toBe("info");
  });
});
