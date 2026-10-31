import { describe, expect, it, vi } from "vitest";
import { Migration20261031131551_session_note_rejected_replacement } from "./Migration20261031131551_session_note_rejected_replacement";

describe("Migration20261031131551_session_note_rejected_replacement", () => {
  it("adds and removes rejected replacement tracking", async () => {
    const migration = new Migration20261031131551_session_note_rejected_replacement({} as never, {} as never);
    const statements: string[] = [];
    vi.spyOn(migration, "addSql").mockImplementation((sql) => statements.push(String(sql)));

    await migration.up();
    await migration.down();

    expect(statements).toEqual([
      'alter table "session_notes" add "rejected_replacement_count" int not null default 0, add "replaced_at" timestamptz null;',
      'alter table "session_notes" drop column "rejected_replacement_count", drop column "replaced_at";',
    ]);
  });
});
