import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { inject } from "vitest";

const execFileAsync = promisify(execFile);

/**
 * Runs one SQL statement in the test database through `docker exec … psql` (no database driver in the tests)
 * and returns its output, one row per line, fields separated by `|`. For seeding states the app cannot reach
 * quickly (a deadline in the past) and for checking what was stored.
 */
export async function sql(statement: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "docker",
    ["exec", inject("databaseContainerId"), "psql", "-U", "devmentor", "-d", "devmentor", "-v", "ON_ERROR_STOP=1", "-At", "-c", statement],
    { timeout: 30_000 },
  );
  return stdout.trim();
}
