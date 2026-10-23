export { ormConfig } from "./config";
export { getOrm } from "./orm";
export * from "./entities";
export { SESSION_LENGTHS, CURRENCY, MENTOR_TAGS, type SessionLength, type MentorTag } from "./constants";

// The only package allowed to import @mikro-orm/* – other packages use these re-exports.
export type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
export { UniqueConstraintViolationException } from "@mikro-orm/core";
