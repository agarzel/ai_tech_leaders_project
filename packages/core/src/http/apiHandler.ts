import { logger } from "../logger";
import { AppError, ForbiddenError, type FieldErrors } from "./errors";

/** Custom header every state-changing request must carry (CSRF defense). Must match `CLIENT_HEADER` in @devmentor/ui apiCall. */
export const CLIENT_HEADER = "x-devmentor-client";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: FieldErrors } };

export type RouteParams = Record<string, string | string[] | undefined>;

// Routes without dynamic segments may receive no params at all.
export type RouteContext = { params?: Promise<RouteParams> };

export type HandlerArgs = { req: Request; params: RouteParams };

type HandlerOptions = { successStatus?: number };

/**
 * Wraps a route handler: CSRF check, `{ ok, data }` / `{ ok, error }` envelope, AppError → status code,
 * unexpected errors logged and returned as a generic 500. Route handlers never write their own try/catch.
 */
export function apiHandler<T>(
  handler: (args: HandlerArgs) => Promise<T>,
  { successStatus = 200 }: HandlerOptions = {},
) {
  return async (req: Request, ctx?: RouteContext): Promise<Response> => {
    // Reading request headers also marks the route as request-time (no prerendering with Cache Components).
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

    try {
      if (STATE_CHANGING_METHODS.has(req.method) && req.headers.get(CLIENT_HEADER) !== "1") {
        throw new ForbiddenError("Missing client header");
      }

      const data = await handler({ req, params: (await ctx?.params) ?? {} });
      return Response.json({ ok: true, data } satisfies ApiResult<T>, { status: successStatus });
    } catch (error) {
      if (error instanceof AppError) {
        const body: ApiResult<never> = {
          ok: false,
          error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors },
        };
        return Response.json(body, { status: error.status });
      }

      logger.error({ err: error, requestId, method: req.method, url: req.url }, "Unhandled API error");
      const body: ApiResult<never> = {
        ok: false,
        error: { code: "internal_error", message: "Internal server error" },
      };
      return Response.json(body, { status: 500 });
    }
  };
}
