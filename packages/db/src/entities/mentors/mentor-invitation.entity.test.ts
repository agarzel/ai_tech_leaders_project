import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entities, MentorInvitation } from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

function meta() {
  return orm.getMetadata().get(MentorInvitation);
}

describe("MentorInvitation entity", () => {
  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("mentor_invitations");
  });

  it("stores only a unique token hash, with no column for the raw token", () => {
    const { properties } = meta();

    expect(properties.tokenHash.fieldNames).toEqual(["token_hash"]);
    expect(properties.tokenHash.unique).toBe(true);
    expect(Object.keys(properties)).not.toContain("token");
  });

  it("indexes the email without making it unique, so a re-invitation can add a row", () => {
    const { properties } = meta();

    expect(properties.email.index).toBe(true);
    expect(properties.email.unique).toBeFalsy();
  });

  it("has nullable used and revoked timestamps and a required expiry", () => {
    const { properties } = meta();

    expect(properties.usedAt.nullable).toBe(true);
    expect(properties.revokedAt.nullable).toBe(true);
    expect(properties.expiresAt.nullable).toBeFalsy();
    expect(properties.expiresAt.fieldNames).toEqual(["expires_at"]);
  });

  it("references the inviting admin and the user who used it (both nullable, the admin's delete sets null)", () => {
    const { properties } = meta();

    expect(properties.createdBy.kind).toBe("m:1");
    expect(properties.createdBy.fieldNames).toEqual(["created_by_id"]);
    expect(properties.createdBy.nullable).toBe(true);
    expect(properties.createdBy.deleteRule).toBe("set null");
    expect(properties.usedBy.kind).toBe("m:1");
    expect(properties.usedBy.fieldNames).toEqual(["used_by_id"]);
    expect(properties.usedBy.nullable).toBe(true);
  });

  it("uses a generated UUID primary key and is exported for discovery", () => {
    expect(meta().primaryKeys).toEqual(["id"]);
    expect(entities).toContain(MentorInvitation);
  });
});
