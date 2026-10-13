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
tests/integration/    Integration tests (testcontainers + agent-browser) – see the root AGENTS.md "Testing" section
next.config.ts        transpilePackages for @devmentor/*, MikroORM server externals, standalone output
```

## Rules

- This package owns HTTP wiring and rendering only: validation → auth → service call → response. Business rules live in `@devmentor/core` services; never query the database here (`@devmentor/db` and `@mikro-orm/*` imports are blocked by lint).
- Route handlers: plain CRUD → `makeCrudRoute` (define it once in `<resource>.crud.ts`, re-export from `route.ts` and `[id]/route.ts`); custom workflows → `apiHandler(async ({ req, params }) => …)`. Never write a bare try/catch or `Response.json` in a route.
- Client components fetch only through `apiCall` from `@devmentor/ui/backend/api/apiCall`, never raw `fetch`.
- Get services from a request scope: `const { healthService } = (await createRequestScope()).cradle;` (`createRequestScope` from `@devmentor/core`).
- Cache Components: code that reads the database or request data calls `await connection()` (from `next/server`) first; in pages such components sit inside `<Suspense>` so the static shell can be prerendered. Do not use `export const dynamic`.
- Pages: `<segment>/page.tsx` with a default export named `<Segment>Page`. Persona route groups (`(marketing)`, `(auth)`, `(student)`, `(mentor)`) are created with their first page.
- UI: admin pages use `@devmentor/ui` components (`@devmentor/ui/components/ui/<name>`); public pages use Tailwind. `src/app/globals.css` holds the theme and `@source`s the ui package.
