import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AUDIT_ACTIONS, AUDIT_ACTOR_KINDS, AuditEvent, entities } from "../index";
import * as clientConstants from "../../constants";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

describe("AuditEvent entity", () => {
  const meta = () => orm.getMetadata().get(AuditEvent);

  it("maps to the plural snake_case table and is discovered", () => {
    expect(meta().tableName).toBe("audit_events");
    expect(entities).toContain(AuditEvent);
  });

  it("keeps actor and target as plain nullable ids, without relations, so history survives a user delete", () => {
    for (const name of ["actorUserId", "targetUserId"] as const) {
      const property = meta().properties[name];
      expect(property.kind).toBe("scalar");
      expect(property.nullable).toBe(true);
      expect(property.fieldNames).toEqual([name === "actorUserId" ? "actor_user_id" : "target_user_id"]);
    }
  });

  it("stores details as json and starts them empty", () => {
    const entity = orm.em.fork().create(AuditEvent, {
      occurredAt: new Date("2026-11-11T10:00:00Z"),
      actorKind: "cli",
      action: "auth.password_set",
    });

    expect(meta().properties.details.type).toBe("JsonType");
    expect(entity.details).toEqual({});
  });

  it("has no column for names, e-mail addresses, passwords, tokens or IPs", () => {
    const columns = Object.keys(meta().properties);

    expect(columns.sort()).toEqual(
      ["action", "actorKind", "actorUserId", "createdAt", "details", "id", "occurredAt", "targetUserId", "updatedAt"].sort(),
    );
  });

  it("exports the actions and actor kinds through the client-safe constants entry", () => {
    expect(clientConstants.AUDIT_ACTIONS).toBe(AUDIT_ACTIONS);
    expect(clientConstants.AUDIT_ACTOR_KINDS).toBe(AUDIT_ACTOR_KINDS);
    expect(AUDIT_ACTIONS).toHaveLength(8);
  });
});
