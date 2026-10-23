# @devmentor/db – MikroORM 7 + PostgreSQL

General rules and the dependency direction are in the root `AGENTS.md`; full standards in `.ai/docs/engineering-standards.md`.

## Layout

```
src/
  config.ts                    MikroORM options used by the app (loads the root .env)
  orm.ts                       getOrm() – one MikroORM instance per server process
  entities/
    base.entity.ts             baseProperties(): uuid id, createdAt, updatedAt
    <concept>/<name>.entity.ts
    index.ts                   every entity MUST be exported and listed in `entities`
  migrations/                  generated migrations + .snapshot-devmentor.json – commit both
  index.ts                     public API (+ EntityManager / MikroORM type re-exports)
mikro-orm.config.ts            CLI config (adds the Migrator)
```

## Rules

- The only package that imports `@mikro-orm/*`. Never imports `@devmentor/core`, `ui`, `app`, `next` or `react`.
- Entities: `defineEntity` + `p` (no decorators), spread `...baseProperties()`, PascalCase singular `name`, plural snake_case `tableName` (`users`). Columns are snake_case automatically.
- Create every entity through `defineSingletonEntity(name, () => defineEntity({...}))` (`entities/define.ts`), never a bare `defineEntity`. It caches the schema on `globalThis`, so every Next.js module graph (RSC, SSR, route handlers) shares one instance; otherwise the ORM discovers the schema of whichever graph ran first and `populate` from another graph fails with `TypeError: Cannot read properties of undefined (reading 'filter')` in `EntityLoader`.
- Relations: make the **whole property** a thunk and pass the target schema directly – `user: () => p.oneToOne(User)`, never `p.oneToOne(() => User)`. The double-wrapped form fails discovery with `Entity '' was not discovered`.
- After changing an entity: `npm run db:migration:create` (repo root) and **review the generated SQL** – a rename is generated as drop + create, which loses data; rewrite it as `alter table ... rename` (see `Migration20261013124642`). Commit the migration with the snapshot.
- Never edit an already merged migration – add a new one. CI fails if entities and migrations are out of sync.
- MikroORM 7 is ESM-only and uses Kysely (no Knex). No raw SQL with interpolated user input.
