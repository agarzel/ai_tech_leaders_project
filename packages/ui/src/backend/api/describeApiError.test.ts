import { describe, expect, it } from "vitest";
import { describeApiError } from "./describeApiError";

describe("describeApiError", () => {
  it("explains a network failure with what to do", () => {
    expect(describeApiError({ code: "network_error", message: "Could not reach the server." })).toEqual({
      title: "No connection",
      message: "We could not reach DevMentor. Check your connection and try again.",
    });
  });

  it.each(["invalid_response", "internal_error"])("hides the technical message of %s", (code) => {
    expect(describeApiError({ code, message: "Internal server error" }, "Could not save")).toEqual({
      title: "Something went wrong on our side",
      message: "Try again in a moment.",
    });
  });

  it("keeps a domain error's message under the fallback title", () => {
    expect(describeApiError({ code: "conflict", message: "This time was just taken" }, "Could not book")).toEqual({
      title: "Could not book",
      message: "This time was just taken",
    });
  });

  it("uses a default title and ignores inherited object keys as codes", () => {
    expect(describeApiError({ code: "constructor", message: "Odd code" })).toEqual({
      title: "Something went wrong",
      message: "Odd code",
    });
  });
});
