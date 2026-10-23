import { describe, expect, it } from "vitest";
import { loginSchema } from "./login.schema";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password.constants";
import { invitationPreviewSchema, registerMentorFormSchema, registerMentorSchema } from "./register-mentor.schema";
import { registerSchema } from "./register.schema";

const issuesByField = (error: { issues: { path: PropertyKey[]; message: string }[] }) =>
  Object.fromEntries(error.issues.map((issue) => [issue.path[0], issue.message]));

describe("registerSchema", () => {
  it("accepts a valid registration, trims the name and strips a role", () => {
    const parsed = registerSchema.parse({
      name: "  Ada  ",
      email: "ada@example.com",
      password: "x".repeat(PASSWORD_MIN_LENGTH),
      role: "admin",
    });

    expect(parsed).toEqual({ name: "Ada", email: "ada@example.com", password: "x".repeat(PASSWORD_MIN_LENGTH) });
  });

  it("rejects an empty name, an invalid email and a short password with readable messages", () => {
    const result = registerSchema.safeParse({ name: " ", email: "nope", password: "short" });

    const issues = issuesByField(result.error!);
    expect(issues.name).toBe("Name is required");
    expect(issues.email).toBe("Enter a valid email address");
    expect(issues.password).toBe(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  });

  it("rejects a password longer than the maximum", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "x".repeat(PASSWORD_MAX_LENGTH + 1),
    });

    expect(issuesByField(result.error!).password).toBe(`Password must be at most ${PASSWORD_MAX_LENGTH} characters long`);
  });

  it("marks the password field so forms render a password input", () => {
    expect(registerSchema.shape.password.meta()?.input).toBe("password");
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password, whatever the policy", () => {
    expect(loginSchema.parse({ email: "ada@example.com", password: "a" })).toEqual({
      email: "ada@example.com",
      password: "a",
    });
  });

  it("rejects an invalid email and an empty password", () => {
    const issues = issuesByField(loginSchema.safeParse({ email: "nope", password: "" }).error!);

    expect(issues.email).toBe("Enter a valid email address");
    expect(issues.password).toBe("Password is required");
  });

  it("rejects an overlong password with the generic credentials message", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "x".repeat(PASSWORD_MAX_LENGTH + 1) });

    expect(issuesByField(result.error!).password).toBe("Invalid email or password");
  });

  it("marks the password field so forms render a password input", () => {
    expect(loginSchema.shape.password.meta()?.input).toBe("password");
  });
});

describe("registerMentorSchema", () => {
  it("accepts a token, a trimmed name and a password, and strips an email or a role", () => {
    const password = "x".repeat(PASSWORD_MIN_LENGTH);

    const parsed = registerMentorSchema.parse({ token: "abc", name: "  Mia ", password, email: "a@b.co", role: "admin" });

    expect(parsed).toEqual({ token: "abc", name: "Mia", password });
  });

  it("rejects a missing token, an empty name and a short password", () => {
    const result = registerMentorSchema.safeParse({ token: "", name: " ", password: "short" });

    const issues = issuesByField(result.error!);
    expect(issues.token).toBe("Invitation token is required");
    expect(issues.name).toBe("Name is required");
    expect(issues.password).toBe(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  });

  it("has a form variant without the token", () => {
    expect(Object.keys(registerMentorFormSchema.shape)).toEqual(["name", "password"]);
  });
});

describe("invitationPreviewSchema", () => {
  it("accepts a token in the body", () => {
    expect(invitationPreviewSchema.safeParse({ token: "abc" }).success).toBe(true);
  });

  it("rejects a missing or empty token", () => {
    expect(invitationPreviewSchema.safeParse({}).success).toBe(false);
    expect(invitationPreviewSchema.safeParse({ token: "" }).success).toBe(false);
  });
});
