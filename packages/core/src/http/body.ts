import { z } from "zod";
import { ValidationError } from "./errors";

/** Validates input with a Zod schema; failure is a `ValidationError` carrying the per-field messages. */
export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    throw new ValidationError("Invalid input", fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}

/** The request's JSON body, validated: the first step of every custom route handler. */
export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  return parseOrThrow(schema, await readJsonBody(req));
}
