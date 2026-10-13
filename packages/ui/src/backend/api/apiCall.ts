import type { ApiError, ApiResult } from "./types";

/** Sent with every request; state-changing routes reject requests without it (CSRF). Must match core's CLIENT_HEADER. */
export const CLIENT_HEADER = "x-devmentor-client";

type ApiCallOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

/** The only sanctioned `fetch()` to `/api/*`. Never throws – network and server failures come back as `{ ok: false }`. */
export async function apiCall<T>(url: string, { method = "GET", body, signal }: ApiCallOptions = {}): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        [CLIENT_HEADER]: "1",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return failure(0, { code: "network_error", message: "Could not reach the server. Check your connection." });
  }

  const payload = await readJsonSafe(response);
  if (isEnvelope(payload)) {
    return payload.ok
      ? { ok: true, data: payload.data as T, status: response.status }
      : { ok: false, error: payload.error, status: response.status };
  }

  return failure(response.status, { code: "invalid_response", message: `Unexpected response from the server (${response.status}).` });
}

/** For call sites that prefer exceptions over branching on `ok`. */
export async function apiCallOrThrow<T>(url: string, options?: ApiCallOptions): Promise<T> {
  const result = await apiCall<T>(url, options);
  if (!result.ok) throw new ApiCallError(result.error, result.status);
  return result.data;
}

export class ApiCallError extends Error {
  constructor(
    readonly error: ApiError,
    readonly status: number,
  ) {
    super(error.message);
    this.name = "ApiCallError";
  }
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isEnvelope(payload: unknown): payload is { ok: true; data: unknown } | { ok: false; error: ApiError } {
  if (typeof payload !== "object" || payload === null || !("ok" in payload)) return false;
  if (payload.ok === true) return "data" in payload;
  if (payload.ok !== false || !("error" in payload)) return false;
  const { error } = payload;
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string";
}

function failure(status: number, error: ApiError): ApiResult<never> {
  return { ok: false, error, status };
}
