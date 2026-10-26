import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("AppError hierarchy", () => {
  it.each([
    [new ValidationError(), "validation_error", 400, "Invalid input"],
    [new UnauthorizedError(), "unauthorized", 401, "Authentication required"],
    [new ForbiddenError(), "forbidden", 403, "Forbidden"],
    [new NotFoundError(), "not_found", 404, "Not found"],
    [new ConflictError(), "conflict", 409, "Conflict"],
    [new PaymentUnavailableError(), "payment_unavailable", 503, "Payment is temporarily unavailable. Try again shortly."],
    [new TooManyRequestsError(), "rate_limited", 429, "Too many attempts. Try again in 15 minutes."],
  ])("%o has code, status and default message", (error, code, status, message) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code, status, message });
    expect(error.name).toBe(error.constructor.name);
  });

  it("keeps custom messages and field errors", () => {
    const fieldErrors = { email: ["Taken"] };

    expect(new ValidationError("Bad", fieldErrors)).toMatchObject({ message: "Bad", fieldErrors });
    expect(new ConflictError("Dup", fieldErrors)).toMatchObject({ message: "Dup", fieldErrors });
    expect(new UnauthorizedError("Log in")).toMatchObject({ message: "Log in" });
    expect(new ForbiddenError("No")).toMatchObject({ message: "No" });
    expect(new NotFoundError("Gone")).toMatchObject({ message: "Gone" });
    expect(new PaymentUnavailableError("Down")).toMatchObject({ message: "Down" });
  });
});
