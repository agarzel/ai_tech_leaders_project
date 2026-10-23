import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./errors";
import { parseJsonBody, parseOrThrow, readJsonBody } from "./body";

const schema = z.object({ name: z.string().min(1, "Name is required") });
const jsonRequest = (body: string) => new Request("http://localhost/api/x", { method: "POST", body });

describe("parseOrThrow", () => {
  it("returns the parsed data", () => {
    expect(parseOrThrow(schema, { name: "Ada", extra: 1 })).toEqual({ name: "Ada" });
  });

  it("throws a ValidationError with field errors", () => {
    expect(() => parseOrThrow(schema, { name: "" })).toThrow(ValidationError);
    try {
      parseOrThrow(schema, { name: "" });
    } catch (error) {
      expect((error as ValidationError).fieldErrors).toEqual({ name: ["Name is required"] });
    }
  });
});

describe("readJsonBody", () => {
  it("parses a JSON body", async () => {
    expect(await readJsonBody(jsonRequest('{"a":1}'))).toEqual({ a: 1 });
  });

  it("throws a ValidationError for a body that is not JSON", async () => {
    await expect(readJsonBody(jsonRequest("not json"))).rejects.toThrow("Request body must be valid JSON");
  });
});

describe("parseJsonBody", () => {
  it("reads and validates in one step", async () => {
    expect(await parseJsonBody(jsonRequest('{"name":"Ada"}'), schema)).toEqual({ name: "Ada" });
  });

  it("rejects a body that fails the schema", async () => {
    await expect(parseJsonBody(jsonRequest('{"name":""}'), schema)).rejects.toBeInstanceOf(ValidationError);
  });
});
