<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# @devmentor/app – Next.js app

The main integration package. General rules are in the root `AGENTS.md`; this file adds app-specific ones. Next.js docs are in `node_modules/next/dist/docs/` at the repo root (dependencies are hoisted).

## Layout

```
app/                  App Router: pages, layouts, route handlers
  admin/              Admin panel – built with shadcn/ui
  api/health/         GET – database health check (200 / 503)
components/ui/        shadcn/ui components (generated – add new ones with the shadcn CLI)
lib/
  db/
    config.ts         MikroORM options used by the app (loads the root .env)
    orm.ts            getOrm() – one MikroORM instance per server process
    entities/         Entities (defineEntity); every entity MUST be exported from entities/index.ts
    migrations/       Generated migrations + schema snapshot – commit both
  di/container.ts     Awilix container + createRequestScope()
  services/           Business services, resolved from the container
  utils.ts            cn() helper for class names
mikro-orm.config.ts   MikroORM CLI config (adds the Migrator)
```

## Database (MikroORM 7)

- Define entities with `defineEntity` + `p` from `@mikro-orm/core` – no decorators. Register each new entity in `lib/db/entities/index.ts`.
- After changing an entity, run `npm run db:migration:create` from the repo root and commit the migration together with `.snapshot-*.json`. CI fails if entities and migrations are out of sync.
- Never edit an already merged migration – add a new one.
- Never use the global `orm.em` in request handling – always the request-scoped `em` from `createRequestScope()`.
- MikroORM 7 is ESM-only and uses Kysely internally (no Knex). Raw SQL: `em.execute(...)` or `em.getKysely()`.

## Dependency injection (Awilix)

- Register services in `lib/di/container.ts` (`asClass(MyService).scoped()`), and add them to the `Cradle` type.
- Services receive dependencies through a single constructor object, e.g. `constructor(private readonly deps: { em: EntityManager })`.
- In route handlers, server components and server actions: `const { myService } = (await createRequestScope()).cradle;`
- Keep business logic in services, not in route handlers or components.

## Rendering (Cache Components)

- Code that reads the database or request data must run at request time: call `await connection()` (from `next/server`) first, and in pages wrap such components in `<Suspense>` so the static shell can be prerendered.

## UI

- Admin pages (`app/admin/**`): shadcn/ui components from `@/components/ui` (Base UI primitives – use the `render` prop, not `asChild`). Add components with `npx shadcn@latest add <name>` run in `packages/app`.
- Public pages: Tailwind CSS.
