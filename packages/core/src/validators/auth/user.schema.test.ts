import { describe, expect, it } from "vitest";
import { userCreateSchema } from "./user-create.schema";
import { userUpdateSchema } from "./user-update.schema";

describe("user schemas", () => {
  it("accepts a valid user and trims the name", () => {
    expect(userCreateSchema.parse({ name: "  Ada  ", email: "ada@example.com", role: "mentor" })).toEqual({
      name: "Ada",
      email: "ada@example.com",
      role: "mentor",
    });
  });

  it("strips unknown fields", () => {
    const parsed = userCreateSchema.parse({ name: "Ada", email: "ada@example.com", role: "admin", id: "x" });

    expect(parsed).not.toHaveProperty("id");
  });

  it("rejects missing name, invalid email and unknown role with readable messages", () => {
    const result = userCreateSchema.safeParse({ name: " ", email: "nope", role: "boss" });

    expect(result.success).toBe(false);
    const issues = Object.fromEntries(result.error!.issues.map((issue) => [issue.path[0], issue.message]));
    expect(issues.name).toBe("Name is required");
    expect(issues.email).toBe("Enter a valid email address");
    expect(issues.role).toMatch(/mentor/);
  });

  it("uses the same shape for updates (PUT)", () => {
    expect(userUpdateSchema).toBe(userCreateSchema);
  });
});
