import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entities, Slot, SLOT_STATUSES } from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

function meta() {
  return orm.getMetadata().get(Slot);
}

describe("Slot entity", () => {
  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("slots");
  });

  it("belongs to a mentor profile and is removed with it", () => {
    const { mentor } = meta().properties;

    expect(mentor.kind).toBe("m:1");
    expect(mentor.fieldNames).toEqual(["mentor_id"]);
    expect(mentor.nullable).toBeFalsy();
    expect(mentor.deleteRule).toBe("cascade");
  });

  it("requires a start time", () => {
    const { startsAt } = meta().properties;

    expect(startsAt.fieldNames).toEqual(["starts_at"]);
    expect(startsAt.nullable).toBeFalsy();
  });

  it("is open by default and knows only open and booked", () => {
    const { status } = meta().properties;

    expect(SLOT_STATUSES).toEqual(["open", "booked"]);
    expect(status.default).toBe("open");
    expect(status.nullable).toBeFalsy();
  });

  it("forbids two slots of one mentor at the same time", () => {
    expect(meta().uniques).toEqual([
      expect.objectContaining({ name: "slots_mentor_id_starts_at_unique", properties: ["mentor", "startsAt"] }),
    ]);
  });

  it("indexes status and start time for listing bookable slots", () => {
    expect(meta().indexes).toEqual([
      expect.objectContaining({ name: "slots_status_starts_at_index", properties: ["status", "startsAt"] }),
    ]);
  });

  it("is exported for discovery", () => {
    expect(entities).toContain(Slot);
  });
});
