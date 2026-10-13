// Configuration for the MikroORM CLI (migrations). The app itself uses src/config.ts.
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { ormConfig } from "./src/config";

export default defineConfig({
  ...ormConfig,
  extensions: [Migrator],
  migrations: {
    path: "./src/migrations",
    pathTs: "./src/migrations",
  },
});
