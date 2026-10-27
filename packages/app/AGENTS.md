<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# @devmentor/app – Next.js (HTTP + pages)

General rules and the dependency direction are in the root `AGENTS.md`. Next.js docs: `node_modules/next/dist/docs/` at the repo root (dependencies are hoisted).

## Layout

```
src/app/              App Router: pages, layouts, route handlers
  admin/              Admin panel – built with @devmentor/ui
  admin/users/        Reference CRUD screen: apiCall + DataTable + CrudForm
  api/<concept>/      Route handlers, one route.ts per resource (api/health/ – DB health check)
  api/users/          Reference CRUD API: users.crud.ts (makeCrudRoute) → route.ts, [id]/route.ts
public/               Static assets
tests/integration/    Integration tests (testcontainers + agent-browser) – see "Integration tests" below
next.config.ts        transpilePackages for @devmentor/*, MikroORM server externals, standalone output
```

## Rules

- This package owns HTTP wiring and rendering only: validation → auth → service call → response. Business rules live in `@devmentor/core` services; never query the database here (`@devmentor/db` and `@mikro-orm/*` imports are blocked by lint).
- Route handlers: plain CRUD → `makeCrudRoute` (define it once in `<resource>.crud.ts`, re-export from `route.ts` and `[id]/route.ts`); custom workflows → `apiHandler(async ({ req, params }) => …)`. Never write a bare try/catch or `Response.json` in a route.
- Client components fetch only through `apiCall` from `@devmentor/ui/backend/api/apiCall`, never raw `fetch`.
- Get services from a request scope: `const { healthService } = (await createRequestScope()).cradle;` (`createRequestScope` from `@devmentor/core`).
- Cache Components: code that reads the database or request data calls `await connection()` (from `next/server`) first; in pages such components sit inside `<Suspense>` so the static shell can be prerendered. Do not use `export const dynamic`.
- Pages: `<segment>/page.tsx` with a default export named `<Segment>Page`. Persona route groups (`(marketing)`, `(auth)`, `(student)`, `(mentor)`) are created with their first page.
- UI: admin pages use `@devmentor/ui` components (`@devmentor/ui/components/ui/<name>`); public pages use Tailwind with the design-system pieces (`PageLayout`, `AppHeader`, `type-*` roles, semantic tokens) – no palette classes, gradients, shadows or emoji (`npm run lint:tokens` scans `packages/app/src`). `src/app/globals.css` holds the theme and `@source`s the ui package.

## Integration tests

- **What:** the real app in a real browser. `tests/integration/*.int.test.ts`, config `vitest.integration.config.mts`.
- **How:** `global-setup.ts` starts an ephemeral PostgreSQL with testcontainers, runs all migrations, seeds known rows, boots the app (`next dev` on port 3100, build dir `.next-test`) and tears everything down afterwards. Tests drive headless Chrome through the agent-browser CLI (`support/browser.ts`).
- **Requires:** Docker running and Chrome for agent-browser (`npm run test:integration:setup`, once).
- **Rule:** every new page or user-facing flow gets an integration test of its main path, plus a screenshot (`browser.screenshot(name)` → `.artifacts/`, uploaded by CI).
- Locate elements the way users do – by role + accessible name or by label (`browser.click("button", "Create user")`, `browser.fill("Email", …)`). Repeated controls (row actions) need unique accessible names, e.g. `aria-label="Delete {name}"`.
- Each test file uses its own browser session; files run sequentially against one app and database, so tests must not depend on data created by another file.
