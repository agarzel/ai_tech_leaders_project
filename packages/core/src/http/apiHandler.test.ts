import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";
import { apiHandler, CLIENT_HEADER } from "./apiHandler";
import { NotFoundError, ValidationError } from "./errors";

vi.mock("../logger", () => ({ logger: { error: vi.fn() } }));

const URL = "http://localhost/api/things";

function request(method = "GET", headers: Record<string, string> = {}) {
  return new Request(URL, { method, headers });
}

describe("apiHandler", () => {
  beforeEach(() => {
    vi.mocked(logger.error).mockClear();
  });

  it("wraps the handler result in an ok envelope with status 200", async () => {
    const handler = apiHandler(async () => ({ hello: "world" }));

    const response = await handler(request(), { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("uses a custom success status", async () => {
    const handler = apiHandler(async () => "created", { successStatus: 201 });

    const response = await handler(request("POST", { [CLIENT_HEADER]: "1" }), { params: Promise.resolve({}) });

    expect(response.status).toBe(201);
  });

  it("passes awaited params and the request to the handler", async () => {
    const inner = vi.fn(async () => null);
    const req = request();

    await apiHandler(inner)(req, { params: Promise.resolve({ id: "42" }) });

    expect(inner).toHaveBeenCalledWith({ req, params: { id: "42" } });
  });

  it("works for routes without a context (no dynamic segments)", async () => {
    const inner = vi.fn(async () => null);

    const response = await apiHandler(inner)(request());

    expect(response.status).toBe(200);
    expect(inner).toHaveBeenCalledWith(expect.objectContaining({ params: {} }));
  });

  it("works when the context has no params", async () => {
    const inner = vi.fn(async () => null);

    await apiHandler(inner)(request(), {});

    expect(inner).toHaveBeenCalledWith(expect.objectContaining({ params: {} }));
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("rejects %s without the client header (CSRF)", async (method) => {
    const inner = vi.fn(async () => null);

    const response = await apiHandler(inner)(request(method));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "forbidden", message: "Missing client header" },
    });
    expect(inner).not.toHaveBeenCalled();
  });

  it("rejects a state-changing request with a wrong client header value", async () => {
    const response = await apiHandler(async () => null)(request("POST", { [CLIENT_HEADER]: "yes" }));

    expect(response.status).toBe(403);
  });

  it("does not require the client header for GET", async () => {
    const response = await apiHandler(async () => null)(request("GET"));

    expect(response.status).toBe(200);
  });

  it("maps AppErrors to their status and envelope, including field errors", async () => {
    const handler = apiHandler(async () => {
      throw new ValidationError("Invalid input", { name: ["Required"] });
    });

    const response = await handler(request());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "validation_error", message: "Invalid input", fieldErrors: { name: ["Required"] } },
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("omits fieldErrors when the error has none", async () => {
    const response = await apiHandler(async () => {
      throw new NotFoundError("User not found");
    })(request());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: { code: "not_found", message: "User not found" } });
  });

  it("hides unexpected errors behind a generic 500 and logs them with the request id", async () => {
    const boom = new Error("database password is hunter2");
    const handler = apiHandler(async () => {
      throw boom;
    });

    const response = await handler(request("GET", { "x-request-id": "req-1" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "internal_error", message: "Internal server error" },
    });
    expect(logger.error).toHaveBeenCalledWith(
      { err: boom, requestId: "req-1", method: "GET", url: URL },
      "Unhandled API error",
    );
  });

  it("generates a request id when the client does not send one", async () => {
    await apiHandler(async () => {
      throw new Error("boom");
    })(request());

    const [context] = vi.mocked(logger.error).mock.calls[0] as unknown as [{ requestId: string }];
    expect(context.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
