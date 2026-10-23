// Thin entry point – the logic and its tests live in src/cli/set-password.ts. Run via `npm run auth:set-password`.
import { runSetPassword } from "../src/cli/set-password";
import { createRequestScope } from "../src/container/container";

try {
  const { cradle } = await createRequestScope();
  console.log(await runSetPassword(process.argv.slice(2), process.env, cradle.authService));
  await cradle.orm.close();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
  process.exit();
}
