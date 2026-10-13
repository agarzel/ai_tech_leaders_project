import { MikroORM } from "@mikro-orm/postgresql";
import { ormConfig } from "./config";

// One ORM (and connection pool) per server process; reused across hot reloads in development.
const globalForOrm = globalThis as unknown as { orm?: Promise<MikroORM> };

export function getOrm(): Promise<MikroORM> {
  globalForOrm.orm ??= MikroORM.init(ormConfig);
  return globalForOrm.orm;
}
