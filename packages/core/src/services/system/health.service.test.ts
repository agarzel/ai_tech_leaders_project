import { describe, expect, it, vi } from "vitest";
import type { EntityManager } from "@devmentor/db";
import type { Logger } from "../../logger";
import { HealthService } from "./health.service";

function setup(execute: () => Promise<unknown>) {
  const em = { execute: vi.fn(execute) };
  const logger = { error: vi.fn() };
  const service = new HealthService({ em: em as unknown as EntityManager, logger: logger as unknown as Logger });
  return { em, logger, service };
}

describe("HealthService", () => {
  it("reports ok when the database answers", async () => {
    const { em, logger, service } = setup(async () => [{ "?column?": 1 }]);

    await expect(service.check()).resolves.toEqual({ status: "ok", database: "ok" });
    expect(em.execute).toHaveBeenCalledWith("select 1");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("reports unreachable and logs when the query fails", async () => {
    const failure = new Error("ECONNREFUSED");
    const { logger, service } = setup(async () => {
      throw failure;
    });

    await expect(service.check()).resolves.toEqual({ status: "error", database: "unreachable" });
    expect(logger.error).toHaveBeenCalledWith({ err: failure }, "Database health check failed");
  });
});
