import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";
import type { AuditAction, AuditActorKind } from "./audit.constants";

/**
 * One append-only entry of the audit log (#119, threat model T-09). Never updated or deleted by the app.
 * Actor and target are plain ids, deliberately without foreign keys: deleting a user keeps its history.
 * Never stores names, e-mail addresses, passwords, tokens or IP addresses – ids and roles only.
 */
export const AuditEvent = defineSingletonEntity("AuditEvent", () =>
  defineEntity({
    name: "AuditEvent",
    tableName: "audit_events",
    properties: {
      ...baseProperties(),
      occurredAt: p.datetime(),
      actorKind: p.string().$type<AuditActorKind>(),
      actorUserId: p.uuid().nullable(),
      action: p.string().$type<AuditAction>(),
      targetUserId: p.uuid().nullable(),
      details: p.json<Record<string, unknown>>().default("{}").onCreate(() => ({})),
    },
    indexes: [
      { name: "audit_events_occurred_at_index", properties: ["occurredAt"] },
      { name: "audit_events_actor_user_id_index", properties: ["actorUserId"] },
      { name: "audit_events_action_occurred_at_index", properties: ["action", "occurredAt"] },
    ],
  }),
);

export type IAuditEvent = InferEntity<typeof AuditEvent>;
