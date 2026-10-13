import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@mikro-orm/postgresql";
import { entities } from "./entities";

// Single .env at the repo root, shared with docker compose, next dev and the MikroORM CLI.
// Variables already set in the environment (e.g. by docker compose) take precedence.
const rootEnvFile = path.resolve(process.cwd(), "../../.env");
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

export const ormConfig = defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities,
  debug: process.env.NODE_ENV === "development",
});
