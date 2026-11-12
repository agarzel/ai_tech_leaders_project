import { describe, expect, it, vi } from "vitest";
import { Migration20261111160000_audit_events } from "./Migration20261111160000_audit_events";

describe("Migration20261111160000_audit_events", () => {
  it("creates the append-only audit table with its indexes and drops it on the way down", async () => {
    const migration = new Migration20261111160000_audit_events({} as never, {} as never);
    const statements: string[] = [];
    vi.spyOn(migration, "addSql").mockImplementation((sql) => statements.push(String(sql)));

    await migration.up();
    await migration.down();

    expect(statements).toEqual([
      `create table "audit_events" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "occurred_at" timestamptz not null, "actor_kind" varchar(255) not null, "actor_user_id" uuid null, "action" varchar(255) not null, "target_user_id" uuid null, "details" jsonb not null default '{}', primary key ("id"));`,
      'create index "audit_events_occurred_at_index" on "audit_events" ("occurred_at");',
      'create index "audit_events_actor_user_id_index" on "audit_events" ("actor_user_id");',
      'create index "audit_events_action_occurred_at_index" on "audit_events" ("action", "occurred_at");',
      'drop table if exists "audit_events" cascade;',
    ]);
    // No foreign keys: deleting a user must keep its history.
    expect(statements.join(" ")).not.toContain("foreign key");
  });
});
