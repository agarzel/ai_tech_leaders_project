import { defineConfig } from "vitest/config";

// Unit tests for the shared packages and repo scripts. The Next.js app (pages, route wiring) is covered by integration tests.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "core",
          root: "packages/core",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "db",
          root: "packages/db",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "scripts",
          root: "scripts",
          environment: "node",
          include: ["**/*.test.mjs"],
        },
      },
      {
        test: {
          name: "ui",
          root: "packages/ui",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**", "packages/db/src/**", "packages/ui/src/**", "scripts/**"],
      exclude: [
        "**/*.test.{ts,tsx,mjs}",
        // Barrels and type-only modules – no logic of their own.
        "packages/*/src/index.ts",
        "packages/core/src/container/cradle.ts",
        "packages/core/src/http/crud.ts",
        "packages/ui/src/backend/api/types.ts",
        // Generated: shadcn primitives (via CLI) and migrations (checked by the CI migrations job).
        "packages/ui/src/components/ui/**",
        "packages/db/src/migrations/**",
      ],
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
