import { beforeEach, describe, expect, it, vi } from "vitest";
import { LockMode, MentorProfile, Slot, UniqueConstraintViolationException, type EntityManager } from "@devmentor/db";
import { FakeClock } from "../../testing/fake-clock";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import { SlotService } from "./slot.service";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-06-01T08:00:00Z");
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

function makeEm() {
  const em = {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    flush: vi.fn(),
    remove: vi.fn(),
    transactional: vi.fn(),
  };
  em.transactional.mockImplementation((work: (tx: unknown) => unknown) => work(em));
  em.create.mockImplementation((_entity: unknown, data: { startsAt: Date }) => ({ id: "new", status: "open", ...data }));
  em.remove.mockImplementation(() => ({ flush: em.flush }));
  return em;
}

const collision = () => new UniqueConstraintViolationException(new Error("duplicate key"));
const profile = { id: "p1" };
const slotRow = (id: string, startsAt: Date, status: "open" | "booked" = "open") => ({ id, startsAt, status });

let em: ReturnType<typeof makeEm>;
let service: SlotService;

beforeEach(() => {
  em = makeEm();
  service = new SlotService({ em: em as unknown as EntityManager, clock: new FakeClock(NOW) });
});

describe("SlotService.publish", () => {
  beforeEach(() => {
    em.findOne.mockResolvedValue(profile);
    em.find.mockResolvedValue([]);
  });

  it("creates a slot on the caller's profile and returns it as bookable", async () => {
    const startsAt = at(2 * DAY);

    const dto = await service.publish("u1", startsAt);

    expect(em.create).toHaveBeenCalledWith(Slot, { mentor: profile, startsAt });
    expect(dto).toEqual({ id: "new", startsAt: startsAt.toISOString(), status: "open", bookable: true });
  });

  it("locks the caller's profile row inside a transaction", async () => {
    await service.publish("u1", at(2 * DAY));

    expect(em.transactional).toHaveBeenCalledTimes(1);
    expect(em.findOne).toHaveBeenCalledWith(MentorProfile, { user: "u1" }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  });

  it("accepts a start exactly at the lead time and exactly at the horizon", async () => {
    await expect(service.publish("u1", at(24 * HOUR))).resolves.toMatchObject({ bookable: true });
    await expect(service.publish("u1", at(60 * DAY))).resolves.toMatchObject({ bookable: true });
  });

  it("refuses a start inside the 24 hour lead time", async () => {
    await expect(service.publish("u1", at(24 * HOUR - 15 * 60_000))).rejects.toBeInstanceOf(ValidationError);
    expect(em.transactional).not.toHaveBeenCalled();
  });

  it("refuses a start beyond the 60 day horizon", async () => {
    await expect(service.publish("u1", at(60 * DAY + 15 * 60_000))).rejects.toBeInstanceOf(ValidationError);
  });

  it("refuses a start that is off the 15 minute grid", async () => {
    await expect(service.publish("u1", at(2 * DAY + 60_000))).rejects.toMatchObject({
      code: "validation_error",
      fieldErrors: { startsAt: [expect.stringContaining("15-minute")] },
    });
  });

  it("refuses a start within 50 minutes of another slot", async () => {
    em.find.mockResolvedValue([slotRow("s1", at(2 * DAY - 45 * 60_000))]);

    await expect(service.publish("u1", at(2 * DAY))).rejects.toMatchObject({ code: "validation_error" });
    expect(em.create).not.toHaveBeenCalled();
  });

  it("queries neighbours strictly closer than 50 minutes, so exactly 50 apart is allowed", async () => {
    const startsAt = at(2 * DAY);

    await service.publish("u1", startsAt);

    expect(em.find).toHaveBeenCalledWith(Slot, {
      mentor: profile,
      startsAt: { $gt: new Date(startsAt.getTime() - 50 * 60_000), $lt: new Date(startsAt.getTime() + 50 * 60_000) },
    });
  });

  it("refuses a duplicate start with a conflict", async () => {
    em.find.mockResolvedValue([slotRow("s1", at(2 * DAY))]);

    await expect(service.publish("u1", at(2 * DAY))).rejects.toBeInstanceOf(ConflictError);
  });

  it("maps a unique constraint violation on insert to a conflict", async () => {
    em.flush.mockRejectedValue(collision());

    await expect(service.publish("u1", at(2 * DAY))).rejects.toBeInstanceOf(ConflictError);
  });

  it("rethrows an unexpected insert failure", async () => {
    em.flush.mockRejectedValue(new Error("db down"));

    await expect(service.publish("u1", at(2 * DAY))).rejects.toThrow("db down");
  });

  it("fails closed for a user without a mentor profile", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.publish("u1", at(2 * DAY))).rejects.toBeInstanceOf(NotFoundError);
    expect(em.create).not.toHaveBeenCalled();
  });
});

describe("SlotService.deleteOwn", () => {
  it("deletes an open slot of the caller", async () => {
    const slot = slotRow("s1", at(2 * DAY));
    em.findOne.mockResolvedValue(slot);

    await service.deleteOwn("u1", "s1");

    expect(em.findOne).toHaveBeenCalledWith(Slot, { id: "s1", mentor: { user: "u1" } });
    expect(em.remove).toHaveBeenCalledWith(slot);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("refuses a booked slot with a conflict", async () => {
    em.findOne.mockResolvedValue(slotRow("s1", at(2 * DAY), "booked"));

    await expect(service.deleteOwn("u1", "s1")).rejects.toBeInstanceOf(ConflictError);
    expect(em.remove).not.toHaveBeenCalled();
  });

  it("reports another mentor's slot as not found", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.deleteOwn("u2", "s1")).rejects.toBeInstanceOf(NotFoundError);
    expect(em.remove).not.toHaveBeenCalled();
  });
});

describe("SlotService.listForOwner", () => {
  it("returns the caller's slots soonest first with status and bookable flag", async () => {
    em.find.mockResolvedValue([
      slotRow("s1", at(2 * HOUR)),
      slotRow("s2", at(2 * DAY)),
      slotRow("s3", at(3 * DAY), "booked"),
      { id: "s4", startsAt: at(4 * DAY) },
    ]);

    const result = await service.listForOwner("u1");

    expect(em.find).toHaveBeenCalledWith(Slot, { mentor: { user: "u1" } }, { orderBy: { startsAt: "asc" } });
    expect(result.map((s) => [s.id, s.status, s.bookable])).toEqual([
      ["s1", "open", false],
      ["s2", "open", true],
      ["s3", "booked", false],
      ["s4", "open", true],
    ]);
  });
});

describe("SlotService.listBookable", () => {
  it("queries open slots from now + 24 h to the 60 day horizon, soonest first", async () => {
    em.find.mockResolvedValue([slotRow("s1", at(2 * DAY))]);

    const result = await service.listBookable("p1");

    expect(em.find).toHaveBeenCalledWith(
      Slot,
      { mentor: "p1", status: "open", startsAt: { $gte: at(24 * HOUR), $lte: at(60 * DAY) } },
      { orderBy: { startsAt: "asc" } },
    );
    expect(result).toEqual([{ id: "s1", startsAt: at(2 * DAY).toISOString(), status: "open", bookable: true }]);
  });

  it("moves the window with the clock", async () => {
    const clock = new FakeClock(NOW);
    service = new SlotService({ em: em as unknown as EntityManager, clock });
    em.find.mockResolvedValue([]);
    clock.advance(DAY);

    await service.listBookable("p1");

    expect(em.find.mock.calls[0]![1].startsAt.$gte).toEqual(at(2 * DAY));
  });
});
