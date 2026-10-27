import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";
import { ARTIFACTS_DIR, REPO_ROOT, run } from "./support/process";

// Throw-away value for the ephemeral test app only; not a real secret.
const INTEGRATION_AUTH_SECRET = "integration-test-auth-secret-0123456789abcdef";
const APP_PORT = Number(process.env.INTEGRATION_APP_PORT ?? 3100);
// Payments run against the fake provider; the sweep secret also signs its webhook events.
const INTEGRATION_PAYMENTS_ENV = {
  PAYMENTS_PROVIDER: "fake",
  SWEEP_SECRET: "integration-test-sweep-secret-0123456789abcdef",
  APP_URL: `http://localhost:${APP_PORT}`,
};
const SERVER_READY_TIMEOUT_MS = 180_000;

declare module "vitest" {
  export interface ProvidedContext {
    baseUrl: string;
    /** Sign-in credentials of the accounts created by the setup (generated per run, never committed). */
    accounts: { admin: { email: string; password: string } };
    /** Id of the PostgreSQL container, for tests that seed or inspect rows (`support/database.ts`). */
    databaseContainerId: string;
    /** The sweep endpoint's token (`x-sweep-token`), the same value the app runs with. */
    sweepSecret: string;
  }
}

/**
 * Starts a fresh PostgreSQL in Docker, applies all migrations, seeds test data and boots the app against it.
 * Everything is torn down afterwards – no state survives between runs.
 */
export default async function setup(project: TestProject) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const database = await new PostgreSqlContainer("postgres:17-alpine")
    .withDatabase("devmentor")
    .withUsername("devmentor")
    .withPassword("devmentor")
    .start();
  const databaseUrl = database.getConnectionUri();

  await run("npm", ["run", "db:migrate"], { DATABASE_URL: databaseUrl });
  await run("npm", ["run", "db:seed"], { DATABASE_URL: databaseUrl });
  const admin = { email: "admin@devmentor.test", password: randomBytes(18).toString("base64url") };
  await createAdmin(admin, databaseUrl);

  const server = startApp(databaseUrl);
  const baseUrl = `http://localhost:${APP_PORT}`;
  try {
    await waitForHealthy(`${baseUrl}/api/health`, server);
    await warmUp(baseUrl);
  } catch (error) {
    await stopApp(server);
    await database.stop();
    throw error;
  }

  project.provide("baseUrl", baseUrl);
  project.provide("accounts", { admin });
  project.provide("databaseContainerId", database.getId());
  project.provide("sweepSecret", INTEGRATION_PAYMENTS_ENV.SWEEP_SECRET);

  return async () => {
    await stopApp(server);
    await database.stop();
  };
}

// Same path as local development: the `auth:set-password` script, which goes through AuthService.
async function createAdmin(admin: { email: string; password: string }, databaseUrl: string) {
  await run("npm", ["run", "auth:set-password", "--", "--email", admin.email, "--admin"], {
    DATABASE_URL: databaseUrl,
    AUTH_SECRET: INTEGRATION_AUTH_SECRET,
    ...INTEGRATION_PAYMENTS_ENV,
    DEVMENTOR_PASSWORD: admin.password,
  });
}

function startApp(databaseUrl: string): ChildProcess {
  const log = createWriteStream(path.join(ARTIFACTS_DIR, "app-server.log"));
  const server = spawn("npm", ["run", "dev"], {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET: INTEGRATION_AUTH_SECRET, ...INTEGRATION_PAYMENTS_ENV, PORT: String(APP_PORT), NEXT_DIST_DIR: ".next-test" },
    // Own process group, so the whole tree (npm → next) can be stopped at once.
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  return server;
}

async function waitForHealthy(url: string, server: ChildProcess) {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`App server exited early (code ${server.exitCode}), see app-server.log`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Not listening yet – retry below.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`App did not become healthy at ${url} within ${SERVER_READY_TIMEOUT_MS / 1000}s, see app-server.log`);
}

// `next dev` compiles a page on its first request. A browser that opens a cold page meanwhile gets caught in a
// rebuild-and-reload loop, so every page the tests open is compiled once here, before any browser starts.
async function warmUp(baseUrl: string) {
  for (const pathname of ["/", "/login", "/register", "/register/mentor", "/admin", "/admin/users", "/admin/invitations", "/mentor", "/mentor/profile", "/mentor/slots", "/mentor/bookings", "/mentors", "/bookings", "/book/warm-up", "/bookings/warm-up", "/dev/fake-checkout/warm-up"]) {
    await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  }
}

async function stopApp(server: ChildProcess) {
  if (server.pid === undefined || server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  process.kill(-server.pid, "SIGTERM");
  await exited;
}
