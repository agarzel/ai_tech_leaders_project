// Response helpers for Mock Service Worker in stories (Storybook only – C15, C16). They produce the same
// JSON envelope as core's apiHandler: { ok: true, data } / { ok: false, error: { code, message, fieldErrors? } }.
import { delay, http, HttpResponse } from "msw";

import type { FieldErrors } from "../../src/backend/api/types";

type Method = "get" | "post" | "put" | "delete";

/** A successful response with `data` in the envelope. */
export function respondOk(method: Method, path: string, data: unknown, status = 200) {
  return http[method](path, () => HttpResponse.json({ ok: true, data }, { status }));
}

/** An error response in the envelope (codes from core's AppError hierarchy and the specs). */
export function respondError(
  method: Method,
  path: string,
  { status, code, message, fieldErrors }: { status: number; code: string; message: string; fieldErrors?: FieldErrors },
) {
  return http[method](path, () => HttpResponse.json({ ok: false, error: { code, message, fieldErrors } }, { status }));
}

/** The request never completes – shows the pending state (submit blocked, "Saving…"). */
export function respondNever(method: Method, path: string, onRequest?: () => void) {
  return http[method](path, async () => {
    onRequest?.();
    await delay("infinite");
    return HttpResponse.json({ ok: true, data: null });
  });
}

/** The network fails before a response arrives (offline, DNS, connection reset). */
export function respondNetworkError(method: Method, path: string) {
  return http[method](path, () => HttpResponse.error());
}
