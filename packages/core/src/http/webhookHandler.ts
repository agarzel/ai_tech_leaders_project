import { logger } from "../logger";
import { AppError } from "./errors";

/**
 * Route wrapper for provider webhooks. They cannot carry the CSRF header, so this is the only CSRF exception –
 * and it always verifies the provider's signature first: `verify` (the gateway's `parseWebhook`) throws on a bad
 * signature and `handler` only ever sees the verified event. Answers 200 when handled, 400 for a bad signature
 * and 500 (so the provider retries) when the handler itself fails.
 */
export function webhookHandler<T>(
  verify: (rawBody: string, headers: Headers) => T | Promise<T>,
  handler: (event: T) => Promise<void>,
) {
  return async (req: Request): Promise<Response> => {
    const rawBody = await req.text();

    let event: T;
    try {
      event = await verify(rawBody, req.headers);
    } catch (error) {
      if (error instanceof AppError) {
        return Response.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
      }
      logger.error({ errorType: errorType(error), path: new URL(req.url).pathname }, "Webhook verification failed unexpectedly");
      return Response.json({ ok: false, error: { code: "internal_error", message: "Internal server error" } }, { status: 500 });
    }

    try {
      await handler(event);
    } catch (error) {
      logger.error({ errorType: errorType(error), path: new URL(req.url).pathname }, "Webhook handler failed");
      return Response.json({ ok: false, error: { code: "internal_error", message: "Internal server error" } }, { status: 500 });
    }
    return Response.json({ ok: true, data: { received: true } });
  };
}

// Only the error's type is logged: messages and stacks can carry secret values or request details.
function errorType(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
