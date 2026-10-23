import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createRequestScope } from "../container/container";
import { CLIENT_HEADER } from "./apiHandler";
import { requireAdmin } from "./auth";
import type { CrudService } from "./crud";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { makeCrudRoute } from "./makeCrudRoute";

vi.mock("../container/container", () => ({ createRequestScope: vi.fn() }));
vi.mock("./auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("../logger", () => ({ logger: { error: vi.fn() } }));

type Thing = { id: string; name: string };
type ThingInput = { name: string };

const ID = "3f0c1d2e-4b5a-4c6d-8e7f-9a0b1c2d3e4f";
const BASE = "http://localhost/api/things";

const service = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies CrudService<Thing, ThingInput, ThingInput>;

const schema = z.object({ name: z.string().min(1) });

const routes = makeCrudRoute({
  // The fake service lives on the cradle under an arbitrary key for this test.
  service: (cradle) => (cradle as unknown as { thingService: typeof service }).thingService,
  createSchema: schema,
  updateSchema: schema,
  access: "admin",
});

const authService = { authenticate: vi.fn() };

const withId = { params: Promise.resolve({ id: ID }) };

type Envelope = { ok: boolean; data?: unknown; error?: { message: string; fieldErrors?: Record<string, string[]> } };

async function json(response: Response): Promise<Envelope> {
  return (await response.json()) as Envelope;
}

function send(method: string, url: string, body?: string) {
  return new Request(url, {
    method,
    headers: { [CLIENT_HEADER]: "1", "content-type": "application/json" },
    body,
  });
}

describe("makeCrudRoute", () => {
  beforeEach(() => {
    vi.mocked(createRequestScope).mockResolvedValue({ cradle: { thingService: service, authService } } as never);
  });

  it("checks access with the request before touching the service", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new ForbiddenError());

    const response = await routes.GET(new Request(BASE));

    expect(response.status).toBe(403);
    expect(service.list).not.toHaveBeenCalled();
  });

  it("answers 401 for an anonymous caller", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new UnauthorizedError());

    const response = await routes.GET(new Request(BASE));

    expect(response.status).toBe(401);
    expect(service.list).not.toHaveBeenCalled();
  });

  it("passes the request and the cradle's auth service to the admin guard", async () => {
    service.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const request = new Request(BASE);

    await routes.GET(request);

    expect(requireAdmin).toHaveBeenCalledWith(request, authService);
  });

  describe("GET", () => {
    it("lists with default paging", async () => {
      service.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });

      const response = await routes.GET(new Request(BASE));

      expect(response.status).toBe(200);
      expect(service.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
      expect(requireAdmin).toHaveBeenCalled();
    });

    it("lists with paging from the query string", async () => {
      service.list.mockResolvedValue({ items: [], total: 0, page: 3, pageSize: 5 });

      await routes.GET(new Request(`${BASE}?page=3&pageSize=5`));

      expect(service.list).toHaveBeenCalledWith({ page: 3, pageSize: 5 });
    });

    it("rejects invalid paging with field errors", async () => {
      const response = await routes.GET(new Request(`${BASE}?page=0&pageSize=1000`));

      expect(response.status).toBe(400);
      const body = await json(response);
      expect(Object.keys(body.error!.fieldErrors!)).toEqual(["page", "pageSize"]);
      expect(service.list).not.toHaveBeenCalled();
    });

    it("gets one record when an id param is present", async () => {
      service.get.mockResolvedValue({ id: ID, name: "A" });

      const response = await routes.GET(new Request(`${BASE}/${ID}`), withId);

      expect(await json(response)).toEqual({ ok: true, data: { id: ID, name: "A" } });
      expect(service.get).toHaveBeenCalledWith(ID);
    });

    it("answers 404 for a malformed id without calling the service", async () => {
      const response = await routes.GET(new Request(`${BASE}/nope`), { params: Promise.resolve({ id: "nope" }) });

      expect(response.status).toBe(404);
      expect(service.get).not.toHaveBeenCalled();
    });
  });

  describe("POST", () => {
    it("creates from the parsed body and answers 201", async () => {
      service.create.mockResolvedValue({ id: ID, name: "A" });

      const response = await routes.POST(send("POST", BASE, JSON.stringify({ name: "A", id: "smuggled" })));

      expect(response.status).toBe(201);
      // Only schema fields reach the service (no mass assignment).
      expect(service.create).toHaveBeenCalledWith({ name: "A" });
    });

    it("rejects an invalid body with field errors", async () => {
      const response = await routes.POST(send("POST", BASE, JSON.stringify({ name: "" })));

      expect(response.status).toBe(400);
      expect((await json(response)).error!.fieldErrors).toHaveProperty("name");
      expect(service.create).not.toHaveBeenCalled();
    });

    it("rejects a body that is not JSON", async () => {
      const response = await routes.POST(send("POST", BASE, "{oops"));

      expect(response.status).toBe(400);
      expect((await json(response)).error!.message).toBe("Request body must be valid JSON");
    });
  });

  describe("PUT", () => {
    it("updates the record with the parsed body", async () => {
      service.update.mockResolvedValue({ id: ID, name: "B" });

      const response = await routes.PUT(send("PUT", `${BASE}/${ID}`, JSON.stringify({ name: "B" })), withId);

      expect(response.status).toBe(200);
      expect(service.update).toHaveBeenCalledWith(ID, { name: "B" });
    });
  });

  describe("DELETE", () => {
    it("deletes the record and returns its id", async () => {
      service.delete.mockResolvedValue(undefined);

      const response = await routes.DELETE(send("DELETE", `${BASE}/${ID}`), withId);

      expect(await json(response)).toEqual({ ok: true, data: { id: ID } });
      expect(service.delete).toHaveBeenCalledWith(ID);
    });
  });
});
