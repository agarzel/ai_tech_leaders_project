import path from "node:path";
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDevelopment ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    const headers = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
    }

    return [{ source: "/:path*", headers }];
  },
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
