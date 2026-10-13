// Mirrors the JSON envelope produced by apiHandler in @devmentor/core (ui must not import core – shape convention).
export type FieldErrors = Record<string, string[]>;

export type ApiError = { code: string; message: string; fieldErrors?: FieldErrors };

export type ApiResult<T> = { ok: true; data: T; status: number } | { ok: false; error: ApiError; status: number };
