# @devmentor/ui – presentation

General rules and the dependency direction are in the root `AGENTS.md`; full standards in `.ai/docs/engineering-standards.md`.

## Layout

```
src/
  components/ui/      shadcn/ui primitives (Base UI, base-nova style) – generated, never hand-written
  components/<concept>/  components tied to one concept's domain shape (created when needed)
  backend/
    api/apiCall.ts       apiCall / apiCallOrThrow – the only sanctioned fetch() to /api/*
    api/types.ts         ApiResult envelope type (mirrors core's – ui must not import core)
    forms/CrudForm.tsx   schema-driven create/edit form
    tables/DataTable.tsx column-config list with loading/error/empty states, pagination, row actions
    feedback/            LoadingMessage, ErrorMessage, EmptyState
  lib/utils.ts        cn() helper
components.json       shadcn config (theme CSS lives in packages/app/src/app/globals.css)
```

## Rules

- Standalone: never import `@devmentor/core`, `@devmentor/db`, `@devmentor/app` or `@mikro-orm/*` – data comes in through props (lint enforces it).
- Add a shadcn primitive by running `npx shadcn@latest add <name>` in `packages/ui`; check the result imports `cn` and nothing from `@/…`.
- Base UI primitives: use the `render` prop, not `asChild`.
- Consumers import by path: `@devmentor/ui/components/ui/<name>`, `@devmentor/ui/backend/<category>/<Name>`, `@devmentor/ui/backend/api/apiCall`, `@devmentor/ui/lib/utils`.
- Use `CrudForm` for every create/edit form, `DataTable` for every list and the `feedback/` components for loading/error/empty states; write a bespoke one only when the UX genuinely does not fit (say why in the PR).
- `CrudForm` infers inputs from the Zod schema: `z.enum` → select, `z.email()` → email, `z.number()` → number, otherwise text.
