import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { USER_ROLES } from "../../constants";
import { entities, User } from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

// The hooks ignore their entity argument; any object will do.
const entity = {} as never;

function userMeta() {
  return orm.getMetadata().get(User);
}

describe("User entity", () => {
  it("maps to the plural snake_case table", () => {
    expect(userMeta().tableName).toBe("users");
  });

  it("has snake_case timestamp columns", () => {
    const { properties } = userMeta();

    expect(properties.createdAt.fieldNames).toEqual(["created_at"]);
    expect(properties.updatedAt.fieldNames).toEqual(["updated_at"]);
  });

  it("uses a generated UUID primary key", () => {
    const { properties, primaryKeys } = userMeta();

    expect(primaryKeys).toEqual(["id"]);
    const id = properties.id.onCreate!(entity, orm.em);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(properties.id.onCreate!(entity, orm.em)).not.toBe(id);
  });

  it("sets timestamps on create and update", () => {
    const { properties } = userMeta();

    expect(properties.createdAt.onCreate!(entity, orm.em)).toBeInstanceOf(Date);
    expect(properties.updatedAt.onCreate!(entity, orm.em)).toBeInstanceOf(Date);
    expect(properties.updatedAt.onUpdate!(entity, orm.em)).toBeInstanceOf(Date);
  });

  it("has a unique email and a role enum defaulting to mentee", () => {
    const { properties } = userMeta();

    expect(properties.email.unique).toBe(true);
    expect(properties.role.items).toEqual([...USER_ROLES]);
    expect(properties.role.default).toBe("mentee");
  });

  it("has a nullable password_hash column", () => {
    const { properties } = userMeta();

    expect(properties.passwordHash.nullable).toBe(true);
    expect(properties.passwordHash.fieldNames).toEqual(["password_hash"]);
  });

  it("exports every entity for explicit discovery", () => {
    expect(entities).toContain(User);
  });
});
