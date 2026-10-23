import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entities, MentorProfile } from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

function meta() {
  return orm.getMetadata().get(MentorProfile);
}

describe("MentorProfile entity", () => {
  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("mentor_profiles");
  });

  it("belongs to exactly one user and is removed with them", () => {
    const { user } = meta().properties;

    expect(user.kind).toBe("1:1");
    expect(user.fieldNames).toEqual(["user_id"]);
    expect(user.nullable).toBeFalsy();
    expect(user.unique).toBe(true);
    expect(user.deleteRule).toBe("cascade");
  });

  it("keeps both prices nullable integers until the mentor sets them", () => {
    const { price25, price50 } = meta().properties;

    expect(price25.nullable).toBe(true);
    expect(price50.nullable).toBe(true);
    expect(price25.runtimeType).toBe("number");
    expect(price50.runtimeType).toBe("number");
  });

  it("has a unique, required share slug", () => {
    const { shareSlug } = meta().properties;

    expect(shareSlug.fieldNames).toEqual(["share_slug"]);
    expect(shareSlug.unique).toBe(true);
    expect(shareSlug.nullable).toBeFalsy();
  });

  it("is unlisted by default (opt-in) and defaults tags and links to empty lists", () => {
    const { listed, tags, links } = meta().properties;

    expect(listed.default).toBe(false);
    expect(tags.default).toBe("[]");
    expect(links.default).toBe("[]");
  });

  it("limits the headline to 120 characters and allows an empty bio", () => {
    const { headline, bio } = meta().properties;

    expect(headline.length).toBe(120);
    expect(headline.nullable).toBe(true);
    expect(bio.nullable).toBe(true);
  });

  it("has no rating or review columns", () => {
    expect(Object.keys(meta().properties).filter((key) => /rating|review/i.test(key))).toEqual([]);
  });

  it("is exported for discovery", () => {
    expect(entities).toContain(MentorProfile);
  });
});
