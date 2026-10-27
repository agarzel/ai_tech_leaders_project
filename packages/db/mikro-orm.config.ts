// Configuration for the MikroORM CLI (migrations, seeder). The app itself uses src/config.ts.
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";
import { ormConfig } from "./src/config";

export default defineConfig({
  ...ormConfig,
  extensions: [Migrator, SeedManager],
  migrations: {
    path: "./src/migrations",
    pathTs: "./src/migrations",
  },
  seeder: {
    path: "./src/seeders",
    pathTs: "./src/seeders",
    // Skip the unit tests next to the seeder.
    glob: "!(*.d|*.test).{js,ts}",
    defaultSeeder: "DatabaseSeeder",
  },
});
