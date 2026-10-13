# @devmentor/ui – presentation

General rules and the dependency direction are in the root `AGENTS.md`; full standards in `.ai/docs/engineering-standards.md`.

## Layout

```
src/
  components/ui/      shadcn/ui primitives (Base UI, base-nova style) – generated, never hand-written
  components/<concept>/  components tied to one concept's domain shape (created when needed)
  backend/<category>/    generic panel building blocks: api/, forms/, tables/, feedback/ (next PR)
  lib/utils.ts        cn() helper
components.json       shadcn config (theme CSS lives in packages/app/src/app/globals.css)
```

## Rules

- Standalone: never import `@devmentor/core`, `@devmentor/db`, `@devmentor/app` or `@mikro-orm/*` – data comes in through props (lint enforces it).
- Add a shadcn primitive by running `npx shadcn@latest add <name>` in `packages/ui`; check the result imports `cn` and nothing from `@/…`.
- Base UI primitives: use the `render` prop, not `asChild`.
- Consumers import by path: `@devmentor/ui/components/ui/<name>`, `@devmentor/ui/lib/utils`.
