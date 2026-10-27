import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import { MESSAGE_MAX_LENGTH } from "../../validators/sessions/session-message.schema";
import { SessionThreadService } from "./session-thread.service";

const MINUTE = 60_000;
const STARTS_AT = new Date("2026-06-10T10:00:00Z");
const during = new Date(STARTS_AT.getTime() + 5 * MINUTE);
const afterEnd = new Date(STARTS_AT.getTime() + 25 * MINUTE + 2 * 60 * 60 * 1000);

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: "b1",
    status: "confirmed",
    lengthMinutes: 25,
    slot: { startsAt: STARTS_AT },
    mentee: { id: "mentee" },
    mentor: { user: { id: "mentor" } },
    ...overrides,
  };
}

function setup(options: { booking?: ReturnType<typeof booking> | null; now?: Date; messages?: unknown[] } = {}) {
  const em = {
    findOne: vi.fn(async () => (options.booking === undefined ? booking() : options.booking)),
    find: vi.fn(async () => options.messages ?? []),
    create: vi.fn((_entity: unknown, data: Record<string, unknown>) => ({ id: "m1", createdAt: undefined, ...data })),
    getReference: vi.fn((_entity: unknown, id: string) => ({ id })),
    flush: vi.fn(async () => undefined),
  };
  const clock = { now: () => options.now ?? during };
  return { em, service: new SessionThreadService({ em: em as never, clock }) };
}

describe("SessionThreadService.post", () => {
  it("stores the trimmed message for a party inside the window", async () => {
    const { em, service } = setup();

    const dto = await service.post("b1", "mentee", "  Where do I start?  ");

    expect(em.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ body: "Where do I start?" }));
    expect(em.flush).toHaveBeenCalled();
    expect(dto.body).toBe("Where do I start?");
    expect(dto.authorId).toBe("mentee");
  });

  it("lets the mentor write too", async () => {
    const { service } = setup();

    await expect(service.post("b1", "mentor", "Sure.")).resolves.toMatchObject({ authorId: "mentor" });
  });

  it("answers not_found for a user who is not a party to the booking", async () => {
    const { service } = setup();

    await expect(service.post("b1", "stranger", "hi")).rejects.toThrow(NotFoundError);
  });

  it("answers not_found when the booking does not exist", async () => {
    const { service } = setup({ booking: null });

    await expect(service.post("b1", "mentee", "hi")).rejects.toThrow(NotFoundError);
  });

  it("refuses a booking that is not confirmed", async () => {
    const { service } = setup({ booking: booking({ status: "awaiting_acceptance" }) });

    await expect(service.post("b1", "mentee", "hi")).rejects.toThrow(ConflictError);
  });

  it("refuses a message before the session starts", async () => {
    const { service } = setup({ now: new Date(STARTS_AT.getTime() - MINUTE) });

    await expect(service.post("b1", "mentee", "hi")).rejects.toThrow(ConflictError);
  });

  it.each(["", "   "])("refuses an empty message %j", async (body) => {
    const { service } = setup();

    await expect(service.post("b1", "mentee", body)).rejects.toThrow(ValidationError);
  });

  it("refuses a message longer than the limit", async () => {
    const { service } = setup();

    await expect(service.post("b1", "mentee", "x".repeat(MESSAGE_MAX_LENGTH + 1))).rejects.toThrow(ValidationError);
  });
});

describe("SessionThreadService.list", () => {
  it("returns the messages oldest first while the thread is readable", async () => {
    const createdAt = new Date("2026-06-10T10:01:00Z");
    const { em, service } = setup({
      now: afterEnd,
      messages: [{ id: "m1", author: { id: "mentee" }, body: "Hi", createdAt }],
    });

    const messages = await service.list("b1", "mentee");

    expect(em.find).toHaveBeenCalledWith(expect.anything(), { booking: "b1" }, { orderBy: { createdAt: "asc" } });
    expect(messages).toEqual([{ id: "m1", authorId: "mentee", body: "Hi", createdAt: createdAt.toISOString() }]);
  });

  it("refuses to show the thread once the grace period is over", async () => {
    const { service } = setup({ now: new Date(STARTS_AT.getTime() + 100 * 60 * 60 * 1000) });

    await expect(service.list("b1", "mentee")).rejects.toThrow(ConflictError);
  });

  it("answers not_found for a stranger", async () => {
    const { service } = setup();

    await expect(service.list("b1", "stranger")).rejects.toThrow(NotFoundError);
  });
});
