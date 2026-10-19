import type { ApiError } from "./types";

export type ErrorDescription = { title: string; message: string };

// Codes whose `message` is technical, not written for the person using the product: `apiCall` produces
// `network_error` and `invalid_response`, and core's apiHandler sends `internal_error` for unexpected
// failures. Their text is replaced with "what happened and what to do" (audit: ErrorMessage showed the
// raw error.message; prompt stage 4 Content: errors say what happened and what to do).
const GENERIC: Record<string, ErrorDescription> = {
  network_error: {
    title: "No connection",
    message: "We could not reach DevMentor. Check your connection and try again.",
  },
  invalid_response: {
    title: "Something went wrong on our side",
    message: "Try again in a moment.",
  },
  internal_error: {
    title: "Something went wrong on our side",
    message: "Try again in a moment.",
  },
};

/**
 * Turns an API error into a title and a message to show. Domain errors (`conflict`, `validation_error`,
 * `not_found`, `rate_limited` …) keep the server's message – core writes those for people, e.g. "This
 * time was just taken" – under `fallbackTitle`.
 */
export function describeApiError(error: ApiError, fallbackTitle = "Something went wrong"): ErrorDescription {
  return Object.hasOwn(GENERIC, error.code) ? GENERIC[error.code] : { title: fallbackTitle, message: error.message };
}
