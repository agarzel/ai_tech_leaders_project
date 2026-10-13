import { defineConfig } from "vitest/config";

// Integration tests: ephemeral PostgreSQL (testcontainers) + the real app + a real browser (agent-browser).
// Requires Docker and Chrome for agent-browser (`npm run test:integration:setup`).
export default defineConfig({
  test: {
    name: "integration",
    root: "packages/app/tests/integration",
    include: ["**/*.int.test.ts"],
    environment: "node",
    globalSetup: ["./global-setup.ts"],
    // One app, one database, one browser session: run files one after another.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
