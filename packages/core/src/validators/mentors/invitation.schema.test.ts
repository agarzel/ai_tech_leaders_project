import { describe, expect, it } from "vitest";
import { invitationCreateSchema } from "./invitation-create.schema";

describe("invitationCreateSchema", () => {
  it("accepts a valid email and strips unknown fields", () => {
    expect(invitationCreateSchema.parse({ email: "ada@example.com", role: "admin" })).toEqual({ email: "ada@example.com" });
  });

  it("rejects an invalid email with a readable message", () => {
    const result = invitationCreateSchema.safeParse({ email: "nope" });

    expect(result.error!.issues[0]!.message).toBe("Enter a valid email address");
  });

  it("rejects a missing email and one longer than 255 characters", () => {
    expect(invitationCreateSchema.safeParse({}).success).toBe(false);
    expect(invitationCreateSchema.safeParse({ email: `${"a".repeat(250)}@example.com` }).success).toBe(false);
  });
});
