// Configuration for the MikroORM CLI (migrations). The app itself uses lib/db/config.ts.
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { ormConfig } from "./lib/db/config";

export default defineConfig({
  ...ormConfig,
  extensions: [Migrator],
  migrations: {
    path: "./lib/db/migrations",
    pathTs: "./lib/db/migrations",
  },
});
