import { z } from "zod";
import { createRequestScope } from "../container/container";
import type { Cradle } from "../container/cradle";
import { apiHandler, type HandlerArgs } from "./apiHandler";
import { parseOrThrow, readJsonBody } from "./body";
import { requireAdmin } from "./auth";
import type { CrudService } from "./crud";
import { NotFoundError } from "./errors";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

type Access = "admin";

// One guard per access level; a new level must add its guard here (enforced by the type).
// A guard reads the request (session cookie) and throws an AppError to refuse it.
const accessGuards: Record<Access, (req: Request, cradle: Cradle) => Promise<unknown>> = {
  admin: (req, cradle) => requireAdmin(req, cradle.authService),
};

type CrudRouteConfig<TDto, TCreate, TUpdate> = {
  /** Picks the service from the request-scoped cradle, e.g. `(cradle) => cradle.userService`. */
  service: (cradle: Cradle) => CrudService<TDto, TCreate, TUpdate>;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  /** Who may call the route. Explicit on purpose – there is no default. */
  access: Access;
};

/**
 * Config-driven CRUD route handlers. Export `{ GET, POST }` from `api/<resource>/route.ts`
 * and `{ GET, PUT, DELETE }` from `api/<resource>/[id]/route.ts`.
 */
export function makeCrudRoute<TDto, TCreate, TUpdate>(config: CrudRouteConfig<TDto, TCreate, TUpdate>) {
  async function resolveService(req: Request) {
    const { cradle } = await createRequestScope();
    await accessGuards[config.access](req, cradle);
    return config.service(cradle);
  }

  return {
    GET: apiHandler(async ({ req, params }) => {
      const service = await resolveService(req);
      if (params.id !== undefined) return service.get(parseId(params));

      const searchParams = Object.fromEntries(new URL(req.url).searchParams);
      return service.list(parseOrThrow(pageQuerySchema, searchParams));
    }),

    POST: apiHandler(
      async ({ req }) => {
        const service = await resolveService(req);
        return service.create(parseOrThrow(config.createSchema, await readJsonBody(req)));
      },
      { successStatus: 201 },
    ),

    PUT: apiHandler(async ({ req, params }) => {
      const service = await resolveService(req);
      return service.update(parseId(params), parseOrThrow(config.updateSchema, await readJsonBody(req)));
    }),

    DELETE: apiHandler(async ({ req, params }) => {
      const service = await resolveService(req);
      const id = parseId(params);
      await service.delete(id);
      return { id };
    }),
  };
}

function parseId(params: HandlerArgs["params"]): string {
  // A malformed id can never match a record – answer 404 instead of letting the database reject it.
  const result = z.uuid().safeParse(params.id);
  if (!result.success) throw new NotFoundError();
  return result.data;
}
