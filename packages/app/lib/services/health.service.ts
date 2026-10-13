import type { EntityManager } from "@mikro-orm/postgresql";

export type HealthStatus = { status: "ok" | "error"; database: "ok" | "unreachable" };

export class HealthService {
  constructor(private readonly deps: { em: EntityManager }) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.deps.em.execute("select 1");
      return { status: "ok", database: "ok" };
    } catch (error) {
      console.error("Database health check failed", error);
      return { status: "error", database: "unreachable" };
    }
  }
}
