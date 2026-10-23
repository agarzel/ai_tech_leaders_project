import { parseArgs } from "node:util";
import { z } from "zod";
import type { AuthService } from "../services/auth/auth.service";

/** Environment variable the password is read from – never a command-line argument (it would land in shell history and `ps`). */
export const PASSWORD_ENV_VAR = "DEVMENTOR_PASSWORD";

const emailSchema = z.email();

/**
 * `npm run auth:set-password -- --email <e> [--admin]`: sets or resets an account's password.
 * Returns a confirmation line; never includes the password. Errors carry an actionable message.
 */
export async function runSetPassword(
  argv: string[],
  env: Record<string, string | undefined>,
  authService: Pick<AuthService, "setPassword">,
): Promise<string> {
  const { values } = parseArgs({
    args: argv,
    options: { email: { type: "string" }, admin: { type: "boolean", default: false } },
    strict: true,
  });

  const email = emailSchema.safeParse(values.email);
  if (!email.success) throw new Error("Usage: npm run auth:set-password -- --email <email> [--admin]");

  const password = env[PASSWORD_ENV_VAR];
  if (!password) {
    throw new Error(`Set ${PASSWORD_ENV_VAR} first, e.g. \`read -rs ${PASSWORD_ENV_VAR} && export ${PASSWORD_ENV_VAR}\` (12-128 characters).`);
  }

  const user = await authService.setPassword(email.data, password, { admin: values.admin });
  return `Password set for ${user.email} (role: ${user.role}).`;
}
