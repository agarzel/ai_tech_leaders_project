import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Dependency direction: app → core → db; ui is importable by app only.
// Only @devmentor/db may import @mikro-orm/*; core never imports next/react.
const mikroOrm = { group: ["@mikro-orm/*"], message: "Only @devmentor/db may import @mikro-orm/*." };
const pkg = (name, reason) => ({ name, message: reason });
const pkgGroup = (group, reason) => ({ group, message: reason });

const uiPaths = [
  pkg("@devmentor/core", "ui is standalone – pass data in via props."),
  pkg("@devmentor/db", "ui is standalone – pass data in via props."),
  pkg("@devmentor/app", "ui must not depend on the app."),
];

const restrict = (files, { paths = [], patterns = [] }) => ({
  files,
  rules: { "no-restricted-imports": ["error", { paths, patterns }] },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: "packages/app/" } },
  },
  restrict(["packages/db/**"], {
    paths: [
      pkg("@devmentor/core", "db is the bottom layer: app → core → db."),
      pkg("@devmentor/ui", "db must not depend on UI."),
      pkg("@devmentor/app", "db must not depend on the app."),
      pkg("react", "db must not depend on React."),
    ],
    patterns: [pkgGroup(["next", "next/*"], "db must not depend on Next.js.")],
  }),
  restrict(["packages/core/**"], {
    paths: [
      pkg("@devmentor/ui", "core must not depend on UI."),
      pkg("@devmentor/app", "core must not depend on the app."),
      pkg("react", "core must not import React."),
    ],
    patterns: [pkgGroup(["next", "next/*"], "core must not import Next.js."), mikroOrm],
  }),
  restrict(["packages/ui/**"], { paths: uiPaths, patterns: [mikroOrm] }),
  // The shadcn CLI generates `import { cn } from "cn"`; primitives must use the configured cn that
  // knows the design-system utilities (h-control, type-label …) – POSTEP.md F5/B25.
  restrict(["packages/ui/src/components/**"], {
    paths: [...uiPaths, pkg("cn", 'Import cn from "@devmentor/ui/lib/utils" (configured for design-system classes).')],
    patterns: [mikroOrm],
  }),
  restrict(["packages/app/**"], {
    paths: [pkg("@devmentor/db", "app talks to the database through @devmentor/core services.")],
    patterns: [mikroOrm],
  }),
  globalIgnores([
    "**/.next/**",
    "**/.next-test/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    "packages/db/src/migrations/**",
    "coverage/**",
    ".vitest/**",
    "**/storybook-static/**",
  ]),
]);

export default eslintConfig;
