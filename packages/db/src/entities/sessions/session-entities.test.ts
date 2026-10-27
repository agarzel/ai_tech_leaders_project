import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entities, Message, SessionNote, SESSION_NOTE_STATUSES } from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

describe("Message entity", () => {
  const meta = () => orm.getMetadata().get(Message);

  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("messages");
  });

  it.each([
    ["booking", "booking_id"],
    ["author", "author_id"],
  ] as const)("refuses to delete the %s while a message references it", (name, column) => {
    const relation = meta().properties[name];

    expect(relation.kind).toBe("m:1");
    expect(relation.fieldNames).toEqual([column]);
    expect(relation.deleteRule).toBe("restrict");
  });

  it("stores the body as text", () => {
    expect(meta().properties.body.columnTypes).toEqual(["text"]);
  });
});

describe("SessionNote entity", () => {
  const meta = () => orm.getMetadata().get(SessionNote);

  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("session_notes");
  });

  it("allows one note per booking", () => {
    const booking = meta().properties.booking;

    expect(booking.kind).toBe("m:1");
    expect(booking.fieldNames).toEqual(["booking_id"]);
    expect(meta().uniques).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "session_notes_booking_id_unique" })]),
    );
  });

  it("starts as a draft and lists the three statuses", () => {
    expect(meta().properties.status.default).toBe("draft");
    expect(SESSION_NOTE_STATUSES).toEqual(["draft", "approved", "rejected"]);
  });

  it("keeps the decision time nullable until the mentee decides", () => {
    expect(meta().properties.decidedAt.nullable).toBe(true);
  });
});
