import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo: trace dependencies from the repo root (node_modules is hoisted there).
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // MikroORM 7 packages not covered by Next.js' built-in external list.
  serverExternalPackages: ["@mikro-orm/sql", "@mikro-orm/postgresql", "kysely"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
