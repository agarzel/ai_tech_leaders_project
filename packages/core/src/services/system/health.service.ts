import type { EntityManager } from "@devmentor/db";
import type { Logger } from "../../logger";

export type HealthStatus = { status: "ok" | "error"; database: "ok" | "unreachable" };

export class HealthService {
  constructor(private readonly deps: { em: EntityManager; logger: Logger }) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.deps.em.execute("select 1");
      return { status: "ok", database: "ok" };
    } catch (error) {
      this.deps.logger.error({ err: error }, "Database health check failed");
      return { status: "error", database: "unreachable" };
    }
  }
}
