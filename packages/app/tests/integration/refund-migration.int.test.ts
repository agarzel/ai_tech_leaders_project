import { expect, inject, it } from "vitest";
import { sql } from "./support/database";
import { run } from "./support/process";

const databaseUrl = inject("databaseUrl");
const migrationName = "Migration20261031072736";

async function migrate(direction: "up" | "down"): Promise<void> {
  await run(
    "npm",
    ["exec", "--workspace", "@devmentor/db", "--", "mikro-orm", `migration:${direction}`, "--only", migrationName],
    { DATABASE_URL: databaseUrl },
  );
}

async function refundFailureColumnCount(): Promise<string> {
  return sql(
    "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'refund_failure_ids'",
  );
}

it("applies and rolls back the refund failure ids migration", async () => {
  expect(await refundFailureColumnCount()).toBe("1");

  await migrate("down");
  try {
    expect(await refundFailureColumnCount()).toBe("0");
  } finally {
    await migrate("up");
  }

  expect(await refundFailureColumnCount()).toBe("1");
});
