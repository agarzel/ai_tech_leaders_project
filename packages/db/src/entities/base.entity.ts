import { p } from "@mikro-orm/core";

/**
 * Properties shared by every entity: UUID primary key (no sequential-ID enumeration) and timestamps.
 * A function, so each entity gets its own property builders.
 */
export function baseProperties() {
  return {
    id: p.uuid().primary().onCreate(() => crypto.randomUUID()),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  };
}
