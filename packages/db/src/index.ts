export { ormConfig } from "./config";
export { getOrm } from "./orm";
export * from "./entities";

// The only package allowed to import @mikro-orm/* – other packages use these re-exports.
export type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
