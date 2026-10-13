import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiCallError, apiCall, apiCallOrThrow, CLIENT_HEADER } from "./apiCall";

const fetchMock = vi.fn<typeof fetch>();

function reply(body: string, status = 200) {
  fetchMock.mockResolvedValue(new Response(body, { status }));
}

describe("apiCall", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a GET with the client header and returns data from an ok envelope", async () => {
    reply(JSON.stringify({ ok: true, data: [1, 2] }));

    const result = await apiCall<number[]>("/api/things");

    expect(result).toEqual({ ok: true, data: [1, 2], status: 200 });
    expect(fetchMock).toHaveBeenCalledWith("/api/things", {
      method: "GET",
      signal: undefined,
      headers: { [CLIENT_HEADER]: "1" },
      body: undefined,
    });
  });

  it("serialises a JSON body and passes method and signal", async () => {
    reply(JSON.stringify({ ok: true, data: null }), 201);
    const signal = new AbortController().signal;

    await apiCall("/api/things", { method: "POST", body: { name: "A" }, signal });

    expect(fetchMock).toHaveBeenCalledWith("/api/things", {
      method: "POST",
      signal,
      headers: { [CLIENT_HEADER]: "1", "content-type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    });
  });

  it("returns the server error envelope with its status", async () => {
    const error = { code: "conflict", message: "Taken", fieldErrors: { email: ["Taken"] } };
    reply(JSON.stringify({ ok: false, error }), 409);

    expect(await apiCall("/api/things")).toEqual({ ok: false, error, status: 409 });
  });

  it("turns a network failure into a network_error result", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await apiCall("/api/things");

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: "network_error" } });
  });

  it("rethrows aborts so callers can ignore cancelled requests", async () => {
    fetchMock.mockRejectedValue(new DOMException("aborted", "AbortError"));

    await expect(apiCall("/api/things")).rejects.toMatchObject({ name: "AbortError" });
  });

  it.each([
    ["an empty body", "", 502],
    ["HTML", "<html>Bad gateway</html>", 502],
    ["a non-object", "42", 200],
    ["null", "null", 200],
    ["an object without ok", JSON.stringify({ data: 1 }), 200],
    ["ok: true without data", JSON.stringify({ ok: true }), 200],
    ["ok neither true nor false", JSON.stringify({ ok: "yes", error: {} }), 200],
    ["ok: false without error", JSON.stringify({ ok: false }), 500],
    ["an error that is not an object", JSON.stringify({ ok: false, error: "boom" }), 500],
    ["an error that is null", JSON.stringify({ ok: false, error: null }), 500],
    ["an error without a message", JSON.stringify({ ok: false, error: { code: "x" } }), 500],
    ["an error with a non-string message", JSON.stringify({ ok: false, error: { message: 1 } }), 500],
  ])("treats %s as an invalid response", async (_label, body, status) => {
    reply(body, status);

    const result = await apiCall("/api/things");

    expect(result).toEqual({
      ok: false,
      status,
      error: { code: "invalid_response", message: `Unexpected response from the server (${status}).` },
    });
  });
});

describe("apiCallOrThrow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the data on success", async () => {
    reply(JSON.stringify({ ok: true, data: { id: "1" } }));

    await expect(apiCallOrThrow("/api/things/1")).resolves.toEqual({ id: "1" });
  });

  it("throws an ApiCallError carrying the error and status", async () => {
    reply(JSON.stringify({ ok: false, error: { code: "not_found", message: "Gone" } }), 404);

    const error = await apiCallOrThrow("/api/things/1").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiCallError);
    expect(error).toMatchObject({ name: "ApiCallError", message: "Gone", status: 404, error: { code: "not_found" } });
  });
});
