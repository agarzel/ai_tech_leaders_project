# @devmentor/core – business logic

General rules and the dependency direction are in the root `AGENTS.md`; full standards in `.ai/docs/engineering-standards.md`.

## Layout

```
src/
  config/env.ts         getEnv() – Zod-validated environment (checked when the container is created)
  logger.ts             pino logger with secret redaction (registered as `logger` in the cradle)
  container/
    cradle.ts           Cradle type – every registered dependency by camelCase key
    container.ts        Awilix container, getContainer(), createRequestScope()
  http/
    errors.ts           AppError + ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError
    apiHandler.ts       wraps route handlers: CSRF header check, envelope, error → status, logging
    makeCrudRoute.ts    CRUD handlers from a CrudService + Zod schemas (+ explicit `access`)
    crud.ts             CrudService, Page, PageQuery
    auth.ts             requireAdmin() – TEMPORARY until the auth concept exists
  services/<concept>/   <name>.service.ts – one concept's business rules
  validators/<concept>/ <name>-<action>.schema.ts – Zod schemas shared by routes and forms
  index.ts              Public API (server only)
```

## Rules

- May import `@devmentor/db` (incl. its MikroORM type re-exports) and plain libraries. Never `next`, `react`, `@devmentor/ui`, `@devmentor/app` or `@mikro-orm/*` (lint enforces it).
- A new service = a new file in `services/<concept>/`, a new explicit `asClass(XService).scoped()` line in `container.ts`, a new key in `cradle.ts`, and an export in `index.ts`. No auto-discovery (`loadModules`).
- Services receive dependencies through one constructor object: `constructor(private readonly deps: { em: EntityManager })`. Use the request-scoped `em`, never the global `orm.em`.
- Services never build HTTP responses; they return DTOs (never entities) or throw `AppError` subclasses. Unexpected errors are left to `apiHandler`.
- Services write only explicitly named fields from parsed input – never spread a request body into `em.create`/`em.assign` (mass assignment).
- Validators import only `zod` and client-safe constants (`@devmentor/db/constants`) – they are bundled into client components via `@devmentor/core/validators/...`. Never import the package root (`@devmentor/core`) from a client component except with `import type`.
- Log through the injected `logger` with context objects; never log secrets.
- Multi-step writes on shared state (slots, bookings, payments) run in a DB transaction.
