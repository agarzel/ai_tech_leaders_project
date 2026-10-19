# @devmentor/ui – presentation

General rules and the dependency direction are in the root `AGENTS.md`; full standards in `.ai/docs/engineering-standards.md`.

## Layout

```
src/
  styles/tokens.css   design tokens – raw, semantic and component layers, light (:root) and dark (.dark); the ONLY file with colour values
  styles/theme.css    Tailwind 4 mapping (@theme inline), spacing utilities (gap-in-group, p-panel, py-list-row, h-control …), type roles (type-*)
  components/ui/      shadcn/ui primitives (Base UI, base-nova style) – added via the CLI, then adapted to tokens; never written from scratch
  components/<concept>/  components tied to one concept's domain shape (created when needed)
  backend/
    api/apiCall.ts       apiCall / apiCallOrThrow – the only sanctioned fetch() to /api/*
    api/types.ts         ApiResult envelope type (mirrors core's – ui must not import core)
    forms/CrudForm.tsx   schema-driven create/edit form
    tables/DataTable.tsx column-config list with loading/error/empty states, pagination, row actions
    feedback/            LoadingMessage, ErrorMessage, EmptyState
  lib/utils.ts        cn() helper, configured for the design-system utilities
stories/              Storybook stories and MDX docs (outside src/ – not part of unit coverage)
.storybook/           Storybook config, theme switch (class on <html>), documentation blocks (not exported)
vitest.storybook.config.mts  story tests in Chromium, one project per theme
POSTEP.md             working log of the design-system task (lesson 6)
components.json       shadcn config (CSS variables go to src/styles/tokens.css; the app imports it in globals.css)
```

## Rules

- Standalone: never import `@devmentor/core`, `@devmentor/db`, `@devmentor/app` or `@mikro-orm/*` – data comes in through props (lint enforces it).
- Add a shadcn primitive by running `npx shadcn@latest add <name>` in `packages/ui`; check the result imports `cn` and nothing from `@/…`.
- Base UI primitives: use the `render` prop, not `asChild`.
- Links in running text: `className="link-text"` on a plain `<a>` (utility in `theme.css`, T11); clickable list rows use `ItemLink` inside `ItemTitle`.
- Every value comes from a token: no colour literals outside `src/styles/tokens.css`, no Tailwind palette classes (`bg-zinc-900`, `text-white`), no arbitrary values (`p-[13px]`). `npm run lint:tokens` checks it. Use semantic classes (`bg-card`, `text-muted-foreground`, `gap-in-group`, `type-meta`).
- After `npx shadcn@latest add`, adapt the primitive to the tokens, import `cn` from `@devmentor/ui/lib/utils` (the configured one – ESLint rejects `"cn"` inside `src/components/**`), and check `package.json` for dependencies outside the plan. Refuse overwriting existing files; compare with `git show HEAD:<file>`, never `git stash`.
- Component docs: `stories/primitives/<Name>.mdx` (13 sections) + `<Name>.stories.tsx` (Playground, variants/sizes, state matrix with frozen hover/focus via `data-preview-state`, long content at 320 px, a play-function test).
- Tests: Testing Library + `user-event`, query by role/label (what users and screen readers see), jest-dom matchers. Watch for duplicate live regions – shadcn `Spinner` already has `role="status"`.
- Consumers import by path: `@devmentor/ui/components/ui/<name>`, `@devmentor/ui/backend/<category>/<Name>`, `@devmentor/ui/backend/api/apiCall`, `@devmentor/ui/lib/utils`.
- Use `CrudForm` for every create/edit form, `DataTable` for every tabular (admin) list – product lists (bookings, slots) use the dense list row – and the `feedback/` components for loading/error/empty states; write a bespoke one only when the UX genuinely does not fit (say why in the PR).
- `CrudForm` infers inputs from the Zod schema: `z.enum` → select, `z.email()` → email, `z.number()` → number, otherwise text.
