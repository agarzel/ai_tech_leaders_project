import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Integration tests run their own dev server; a separate build dir avoids clashing with `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Monorepo: trace dependencies from the repo root (node_modules is hoisted there).
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Internal workspace packages are shipped as TypeScript source.
  transpilePackages: ["@devmentor/core", "@devmentor/db", "@devmentor/ui"],
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
