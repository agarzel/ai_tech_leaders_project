# @devmentor/core – business logic

General rules and the dependency direction are in the root `AGENTS.md`; full standards in `.ai/docs/engineering-standards.md`.

## Layout

```
src/
  container/
    cradle.ts         Cradle type – every registered dependency by camelCase key
    container.ts      Awilix container, getContainer(), createRequestScope()
  services/<concept>/ <name>.service.ts – one concept's business rules
  index.ts            Public API of the package
```

## Rules

- May import `@devmentor/db` (incl. its MikroORM type re-exports) and plain libraries. Never `next`, `react`, `@devmentor/ui`, `@devmentor/app` or `@mikro-orm/*` (lint enforces it).
- A new service = a new file in `services/<concept>/`, a new explicit `asClass(XService).scoped()` line in `container.ts`, a new key in `cradle.ts`, and an export in `index.ts`. No auto-discovery (`loadModules`).
- Services receive dependencies through one constructor object: `constructor(private readonly deps: { em: EntityManager })`. Use the request-scoped `em`, never the global `orm.em`.
- Services never build HTTP responses; they return data or throw typed errors (the `AppError` hierarchy arrives with `src/http/`).
- Multi-step writes on shared state (slots, bookings, payments) run in a DB transaction.
