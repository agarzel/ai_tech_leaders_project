import { describe, expect, it, vi } from "vitest";
import { Migration20261031072736 } from "./Migration20261031072736";

describe("Migration20261031072736", () => {
  it("adds and removes the persisted refund failure ids column", async () => {
    const migration = new Migration20261031072736({} as never, {} as never);
    const statements: string[] = [];
    vi.spyOn(migration, "addSql").mockImplementation((sql) => statements.push(String(sql)));

    await migration.up();
    await migration.down();

    expect(statements).toEqual([
      `alter table "payments" add "refund_failure_ids" jsonb not null default '[]';`,
      `alter table "payments" drop column "refund_failure_ids";`,
    ]);
  });
});
