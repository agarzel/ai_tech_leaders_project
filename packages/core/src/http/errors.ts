export type FieldErrors = Record<string, string[]>;

/** Base class for expected, client-facing errors. Services throw these; apiHandler maps them to responses. */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", fieldErrors?: FieldErrors) {
    super("validation_error", 400, message, fieldErrors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("unauthorized", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("forbidden", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super("not_found", 404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", fieldErrors?: FieldErrors) {
    super("conflict", 409, message, fieldErrors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many attempts. Try again in 15 minutes.") {
    super("rate_limited", 429, message);
  }
}

/** The payment provider could not be reached or refused the request; nothing was charged. Safe to retry. */
export class PaymentUnavailableError extends AppError {
  constructor(message = "Payment is temporarily unavailable. Try again shortly.") {
    super("payment_unavailable", 503, message);
  }
}
