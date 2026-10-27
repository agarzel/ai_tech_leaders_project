import { describe, expect, it } from "vitest";
import { MESSAGE_MAX_LENGTH, sessionMessageSchema } from "./session-message.schema";

describe("sessionMessageSchema", () => {
  it("trims the message", () => {
    expect(sessionMessageSchema.parse({ body: "  Hello  " })).toEqual({ body: "Hello" });
  });

  it("accepts a message at the limit", () => {
    expect(sessionMessageSchema.safeParse({ body: "x".repeat(MESSAGE_MAX_LENGTH) }).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(sessionMessageSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("rejects a message over the limit", () => {
    expect(sessionMessageSchema.safeParse({ body: "x".repeat(MESSAGE_MAX_LENGTH + 1) }).success).toBe(false);
  });

  it("rejects a body that is not text", () => {
    expect(sessionMessageSchema.safeParse({ body: 42 }).success).toBe(false);
  });
});
