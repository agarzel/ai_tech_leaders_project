import { describe, expect, it, vi } from "vitest";
import { PASSWORD_ENV_VAR, runSetPassword } from "./set-password";

const PASSWORD = "correct horse battery";

function setup() {
  const authService = { setPassword: vi.fn().mockResolvedValue({ id: "u1", email: "ada@example.com", name: "ada", role: "mentor" }) };
  return { authService, env: { [PASSWORD_ENV_VAR]: PASSWORD } };
}

describe("runSetPassword", () => {
  it("resets a password without the admin flag", async () => {
    const { authService, env } = setup();

    const message = await runSetPassword(["--email", "ada@example.com"], env, authService);

    expect(authService.setPassword).toHaveBeenCalledWith("ada@example.com", PASSWORD, { admin: false });
    expect(message).toBe("Password set for ada@example.com (role: mentor).");
  });

  it("passes the admin flag through", async () => {
    const { authService, env } = setup();

    await runSetPassword(["--email", "ada@example.com", "--admin"], env, authService);

    expect(authService.setPassword).toHaveBeenCalledWith("ada@example.com", PASSWORD, { admin: true });
  });

  it("never echoes the password", async () => {
    const { authService, env } = setup();

    const message = await runSetPassword(["--email", "ada@example.com"], env, authService);

    expect(message).not.toContain(PASSWORD);
  });

  it.each([[[]], [["--email", "not-an-email"]]])("rejects a missing or invalid e-mail (%j) with the usage line", async (argv) => {
    const { authService, env } = setup();

    await expect(runSetPassword(argv, env, authService)).rejects.toThrow("Usage: npm run auth:set-password");
    expect(authService.setPassword).not.toHaveBeenCalled();
  });

  it("explains how to provide the password when the variable is missing", async () => {
    const { authService } = setup();

    await expect(runSetPassword(["--email", "ada@example.com"], {}, authService)).rejects.toThrow(PASSWORD_ENV_VAR);
    expect(authService.setPassword).not.toHaveBeenCalled();
  });

  it("rejects unknown options", async () => {
    const { authService, env } = setup();

    await expect(runSetPassword(["--email", "ada@example.com", "--password", "x"], env, authService)).rejects.toThrow();
  });
});
