import { beforeEach, describe, expect, it, vi } from "vitest";
import { Booking, Payment, Slot, type EntityManager } from "@devmentor/db";
import { NotFoundError } from "../../http/errors";
import { FakeClock } from "../../testing/fake-clock";
import { BookingQueryService, effectiveStatus } from "./booking-query.service";

const NOW = new Date("2026-06-01T08:00:00Z");
const ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const FUTURE = new Date("2026-06-01T09:00:00Z");
const PAST = new Date("2026-06-01T07:00:00Z");

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    status: "awaiting_acceptance",
    acceptBy: FUTURE,
    slot: { startsAt: new Date("2026-06-02T10:00:00Z") },
    mentor: { shareSlug: "ada-abc", user: { name: "Ada" } },
    mentee: { name: "Grace" },
    lengthMinutes: 25,
    priceAmount: 15_000,
    currency: "PLN",
    question: "Why?",
    declineReason: null,
    ...overrides,
  };
}

function setup() {
  const em = { find: vi.fn(), findAndCount: vi.fn(), findOne: vi.fn() };
  const service = new BookingQueryService({ em: em as unknown as EntityManager, clock: new FakeClock(NOW) });
  return { em, service };
}

let ctx: ReturnType<typeof setup>;
beforeEach(() => {
  ctx = setup();
});

describe("effectiveStatus", () => {
  it("reports an unanswered booking past its deadline as expired", () => {
    expect(effectiveStatus("awaiting_acceptance", PAST, NOW)).toBe("expired");
  });

  it.each([
    ["before the deadline", "awaiting_acceptance", FUTURE],
    ["without a deadline", "awaiting_acceptance", null],
    ["another status past a deadline", "confirmed", PAST],
  ] as const)("keeps the status %s", (_name, status, acceptBy) => {
    expect(effectiveStatus(status, acceptBy, NOW)).toBe(status);
  });
});

describe("BookingQueryService.listForMentee", () => {
  it("returns the caller's bookings as DTOs with the payment status and the effective status", async () => {
    ctx.em.findAndCount.mockResolvedValue([[booking({ acceptBy: PAST })], 1]);
    ctx.em.find.mockResolvedValue([{ booking: { id: ID }, status: "refund_requested" }]);

    const page = await ctx.service.listForMentee("u1", { page: 2, pageSize: 5 });

    expect(ctx.em.findAndCount).toHaveBeenCalledWith(
      Booking,
      { mentee: "u1" },
      { populate: ["slot", "mentor.user"], orderBy: { createdAt: "desc" }, limit: 5, offset: 5 },
    );
    expect(ctx.em.find).toHaveBeenCalledWith(Payment, { booking: { $in: [ID] } });
    expect(page).toEqual({
      page: 2,
      pageSize: 5,
      total: 1,
      items: [
        {
          id: ID,
          status: "expired",
          paymentStatus: "refund_requested",
          mentor: { name: "Ada", slug: "ada-abc" },
          startsAt: "2026-06-02T10:00:00.000Z",
          lengthMinutes: 25,
          priceAmount: 15_000,
          currency: "PLN",
          acceptBy: PAST.toISOString(),
          declineReason: null,
          question: "Why?",
        },
      ],
    });
  });

  it("does not read payments when there are no bookings", async () => {
    ctx.em.findAndCount.mockResolvedValue([[], 0]);

    await expect(ctx.service.listForMentee("u1", { page: 1, pageSize: 20 })).resolves.toMatchObject({ items: [], total: 0 });
    expect(ctx.em.find).not.toHaveBeenCalled();
  });

  it("treats a booking without a payment row as still creating its payment", async () => {
    ctx.em.findAndCount.mockResolvedValue([[booking({ status: "pending_payment", acceptBy: null, declineReason: "No" })], 1]);
    ctx.em.find.mockResolvedValue([]);

    const { items } = await ctx.service.listForMentee("u1", { page: 1, pageSize: 20 });

    expect(items[0]).toMatchObject({ status: "pending_payment", paymentStatus: "creating", acceptBy: null, declineReason: "No" });
  });

  it.each([
    ["awaiting_acceptance", { status: "awaiting_acceptance", acceptBy: { $gt: NOW } }],
    ["expired", { $or: [{ status: "expired" }, { status: "awaiting_acceptance", acceptBy: { $lte: NOW } }] }],
    ["confirmed", { status: "confirmed" }],
  ] as const)("filters by the effective %s status", async (status, filter) => {
    ctx.em.findAndCount.mockResolvedValue([[], 0]);

    await ctx.service.listForMentee("u1", { page: 1, pageSize: 20, status });

    expect(ctx.em.findAndCount).toHaveBeenCalledWith(Booking, { mentee: "u1", ...filter }, expect.anything());
  });
});

describe("BookingQueryService.getForMentee", () => {
  it("returns one of the caller's own bookings", async () => {
    ctx.em.findOne.mockResolvedValue(booking());
    ctx.em.find.mockResolvedValue([{ booking: { id: ID }, status: "paid" }]);

    const dto = await ctx.service.getForMentee("u1", ID);

    expect(ctx.em.findOne).toHaveBeenCalledWith(Booking, { id: ID, mentee: "u1" }, { populate: ["slot", "mentor.user"] });
    expect(dto).toMatchObject({ id: ID, status: "awaiting_acceptance", paymentStatus: "paid", question: "Why?" });
  });

  it("answers not found for another person's or a missing booking", async () => {
    ctx.em.findOne.mockResolvedValue(null);

    await expect(ctx.service.getForMentee("u1", OTHER_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("answers not found for an id that is not a UUID without touching the database", async () => {
    await expect(ctx.service.getForMentee("u1", "nope")).rejects.toBeInstanceOf(NotFoundError);
    expect(ctx.em.findOne).not.toHaveBeenCalled();
  });
});

describe("BookingQueryService.listForMentor", () => {
  const awaiting = (id: string, acceptBy: Date) => booking({ id, acceptBy });

  it("lists awaiting bookings first by deadline, then the rest by latest session, with the pending count", async () => {
    ctx.em.find.mockResolvedValue([
      booking({ id: "old", status: "confirmed", slot: { startsAt: new Date("2026-06-03T10:00:00Z") } }),
      awaiting("later", new Date("2026-06-01T12:00:00Z")),
      booking({ id: "new", status: "declined", slot: { startsAt: new Date("2026-06-05T10:00:00Z") } }),
      awaiting("sooner", FUTURE),
      awaiting("lapsed", PAST),
    ]);

    const page = await ctx.service.listForMentor("m1", { page: 1, pageSize: 10 });

    expect(ctx.em.find).toHaveBeenCalledWith(
      Booking,
      { mentor: { user: "m1" }, status: { $in: ["awaiting_acceptance", "confirmed", "declined", "expired"] } },
      { populate: ["slot", "mentee"], limit: 500 },
    );
    expect(page.items.map((item) => item.id)).toEqual(["sooner", "later", "new", "old", "lapsed"]);
    expect(page.pendingCount).toBe(2);
    expect(page.earliestAcceptBy).toBe(FUTURE.toISOString());
    expect(page.items[0]).toEqual(expect.not.objectContaining({ paymentStatus: expect.anything() }));
    expect(page.items[0]).toMatchObject({ mentee: { name: "Grace" } });
  });

  it("pages the ordered list", async () => {
    ctx.em.find.mockResolvedValue([awaiting("a", FUTURE), awaiting("b", new Date("2026-06-01T10:00:00Z"))]);

    const page = await ctx.service.listForMentor("m1", { page: 2, pageSize: 1 });

    expect(page).toMatchObject({ page: 2, pageSize: 1, total: 2, pendingCount: 2 });
    expect(page.items.map((item) => item.id)).toEqual(["b"]);
  });

  it("has no earliest deadline when nothing awaits a decision", async () => {
    ctx.em.find.mockResolvedValue([]);

    await expect(ctx.service.listForMentor("m1", { page: 1, pageSize: 10 })).resolves.toMatchObject({ pendingCount: 0, earliestAcceptBy: null, items: [] });
  });
});

describe("BookingQueryService.getForMentor", () => {
  it("returns one of the caller's bookings without payment details", async () => {
    ctx.em.findOne.mockResolvedValue(booking());

    const dto = await ctx.service.getForMentor("m1", ID);

    expect(ctx.em.findOne).toHaveBeenCalledWith(Booking, { id: ID, mentor: { user: "m1" } }, { populate: ["slot", "mentee"] });
    expect(dto).toMatchObject({ id: ID, mentee: { name: "Grace" } });
    expect(dto).not.toHaveProperty("paymentStatus");
  });

  it("answers not found for another mentor's booking and for a malformed id", async () => {
    ctx.em.findOne.mockResolvedValue(null);

    await expect(ctx.service.getForMentor("m1", OTHER_ID)).rejects.toBeInstanceOf(NotFoundError);
    await expect(ctx.service.getForMentor("m1", "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("BookingQueryService.getOffer", () => {
  const slot = (overrides: Record<string, unknown> = {}) => ({
    id: ID,
    status: "open",
    startsAt: new Date("2026-06-04T10:00:00Z"),
    mentor: { shareSlug: "ada-abc", price25: 8000, price50: null, user: { id: "m1", name: "Ada" } },
    ...overrides,
  });

  it("describes the slot, the mentor and the prices", async () => {
    ctx.em.findOne.mockResolvedValue(slot());

    const offer = await ctx.service.getOffer("u1", ID);

    expect(ctx.em.findOne).toHaveBeenCalledWith(Slot, { id: ID }, { populate: ["mentor.user"] });
    expect(offer).toEqual({
      slotId: ID,
      startsAt: "2026-06-04T10:00:00.000Z",
      bookable: true,
      ownSlot: false,
      mentor: { name: "Ada", slug: "ada-abc", price25: 8000, price50: null, currency: "PLN" },
    });
  });

  it("marks the caller's own slot and a slot that is not bookable", async () => {
    ctx.em.findOne.mockResolvedValue(slot({ status: "booked", mentor: { shareSlug: "a", user: { id: "u1", name: "Ada" } } }));

    await expect(ctx.service.getOffer("u1", ID)).resolves.toMatchObject({
      bookable: false,
      ownSlot: true,
      mentor: { price25: null, price50: null },
    });
  });

  it("answers not found for an unknown slot and for a malformed id", async () => {
    ctx.em.findOne.mockResolvedValue(null);

    await expect(ctx.service.getOffer("u1", OTHER_ID)).rejects.toBeInstanceOf(NotFoundError);
    await expect(ctx.service.getOffer("u1", "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});
