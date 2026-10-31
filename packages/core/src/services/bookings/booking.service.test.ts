import { beforeEach, describe, expect, it, vi } from "vitest";
import { Booking, LockMode, MentorProfile, Payment, User, type EntityManager } from "@devmentor/db";
import { ConflictError, ForbiddenError, PaymentUnavailableError, ValidationError } from "../../http/errors";
import type { PaymentGateway } from "../../payments/payment-gateway";
import { FakeClock } from "../../testing/fake-clock";
import type { SlotService } from "../availability/slot.service";
import type { MentorService } from "../mentors/mentor.service";
import { BOOKING_HOLD_MINUTES, BookingService, MAX_PENDING_PAYMENT_BOOKINGS } from "./booking.service";

const MINUTE = 60_000;
const NOW = new Date("2026-06-01T08:00:00Z");
const input = { slotId: "s1", lengthMinutes: 25, question: "How do I test a service?", entryPoint: "link" };
const mentor = { id: "p1" };

type Calls = string[];

function setup() {
  const calls: Calls = [];
  const tx = {
    count: vi.fn().mockResolvedValue(0),
    findOne: vi.fn().mockResolvedValue({ id: "u1" }),
    create: vi.fn((entity: unknown, data: Record<string, unknown>) => ({ id: entity === Booking ? "b1" : "pay1", ...data })),
    getReference: vi.fn((_entity: unknown, id: string) => ({ ref: id })),
    flush: vi.fn(async () => {
      calls.push("flush");
    }),
  };
  const em = {
    transactional: vi.fn(async (work: (em: unknown) => unknown) => {
      calls.push("tx:start");
      const result = await work(tx);
      calls.push("tx:commit");
      return result;
    }),
    nativeUpdate: vi.fn(async () => {
      calls.push("update-payment");
    }),
  };
  const slot = { id: "s1", status: "open", mentor };
  const slotService = { assertBookable: vi.fn().mockResolvedValue(slot) };
  const mentorService = { priceFor: vi.fn().mockResolvedValue(15_000) };
  const paymentGateway = {
    createCheckout: vi.fn(async () => {
      calls.push("checkout");
      return { sessionId: "cs_1", url: "https://pay.example/cs_1" };
    }),
    parseWebhook: vi.fn(),
  };
  const bookingTransitions = { expirePayment: vi.fn().mockResolvedValue(true) };
  const service = new BookingService({
    em: em as unknown as EntityManager,
    clock: new FakeClock(NOW),
    env: { APP_URL: "https://devmentor.example", PAYMENTS_PROVIDER: "fake" },
    paymentGateway: paymentGateway as unknown as PaymentGateway,
    slotService: slotService as unknown as SlotService,
    mentorService: mentorService as unknown as MentorService,
    bookingTransitions: bookingTransitions as never,
  });
  return { calls, tx, em, slot, slotService, mentorService, paymentGateway, bookingTransitions, service };
}

let ctx: ReturnType<typeof setup>;

beforeEach(() => {
  ctx = setup();
});

describe("BookingService.create", () => {
  it("returns the booking id and the checkout url", async () => {
    await expect(ctx.service.create("u1", input)).resolves.toEqual({ bookingId: "b1", checkoutUrl: "https://pay.example/cs_1" });
  });

  it("creates a pending_payment booking with the price read now and a 35 minute hold", async () => {
    await ctx.service.create("u1", input);

    expect(BOOKING_HOLD_MINUTES).toBe(35);
    expect(ctx.mentorService.priceFor).toHaveBeenCalledWith("p1", 25);
    expect(ctx.tx.create).toHaveBeenCalledWith(Booking, {
      slot: ctx.slot,
      mentee: { ref: "u1" },
      mentor,
      lengthMinutes: 25,
      priceAmount: 15_000,
      question: input.question,
      entryPoint: "link",
      holdExpiresAt: new Date(NOW.getTime() + 35 * MINUTE),
    });
    expect(ctx.tx.getReference).toHaveBeenCalledWith(User, "u1");
  });

  it("marks the slot booked in the same transaction", async () => {
    await ctx.service.create("u1", input);

    expect(ctx.slot.status).toBe("booked");
  });

  it("creates a creating payment with the same amount and a key tied to the booking", async () => {
    await ctx.service.create("u1", input);

    expect(ctx.tx.create).toHaveBeenCalledWith(Payment, {
      booking: expect.objectContaining({ id: "b1" }),
      provider: "fake",
      checkoutIdempotencyKey: "checkout:b1",
      amount: 15_000,
    });
  });

  it("locks the slot row inside the transaction through assertBookable", async () => {
    await ctx.service.create("u1", input);

    expect(ctx.slotService.assertBookable).toHaveBeenCalledWith("s1", NOW, ctx.tx, LockMode.PESSIMISTIC_WRITE);
    expect(ctx.calls.indexOf("tx:start")).toBeLessThan(ctx.calls.indexOf("flush"));
  });

  it("locks the mentee before counting only unexpired pending-payment bookings", async () => {
    ctx.tx.count.mockResolvedValueOnce(1);

    await ctx.service.create("u1", input);

    expect(ctx.tx.findOne).toHaveBeenCalledWith(User, { id: "u1" }, { lockMode: LockMode.PESSIMISTIC_WRITE });
    expect(ctx.tx.count).toHaveBeenNthCalledWith(1, Booking, {
      mentee: "u1",
      status: "pending_payment",
      holdExpiresAt: { $gt: NOW },
    });
    expect(ctx.tx.findOne.mock.invocationCallOrder[0]).toBeLessThan(ctx.tx.count.mock.invocationCallOrder[0]);
  });

  it("rejects creation when the mentee already has two active unpaid bookings", async () => {
    ctx.tx.count.mockImplementation(async (entity: unknown) => (entity === Booking ? MAX_PENDING_PAYMENT_BOOKINGS : 0));

    await expect(ctx.service.create("u1", input)).rejects.toMatchObject({
      code: "conflict",
      status: 409,
      message: "Finish or abandon your previous payment first",
    });

    expect(ctx.slotService.assertBookable).not.toHaveBeenCalled();
    expect(ctx.tx.create).not.toHaveBeenCalled();
    expect(ctx.paymentGateway.createCheckout).not.toHaveBeenCalled();
  });

  it("creates the checkout only after the commit, then opens the payment", async () => {
    await ctx.service.create("u1", input);

    expect(ctx.calls).toEqual(["tx:start", "flush", "tx:commit", "checkout", "update-payment"]);
    expect(ctx.paymentGateway.createCheckout).toHaveBeenCalledWith({
      bookingId: "b1",
      amount: 15_000,
      currency: "PLN",
      description: "DevMentor session, 25 min",
      successUrl: "https://devmentor.example/bookings/b1",
      cancelUrl: "https://devmentor.example/bookings/b1",
      expiresAt: new Date(NOW.getTime() + 34 * MINUTE),
      idempotencyKey: "checkout:b1",
    });
    expect(ctx.em.nativeUpdate).toHaveBeenCalledWith(Payment, { id: "pay1", status: "creating" }, { status: "open", checkoutSessionId: "cs_1" });
  });

  it("expires the booking after a definite checkout failure and propagates the payment error", async () => {
    ctx.paymentGateway.createCheckout.mockRejectedValue(new PaymentUnavailableError());

    await expect(ctx.service.create("u1", input)).rejects.toBeInstanceOf(PaymentUnavailableError);

    expect(ctx.em.nativeUpdate).not.toHaveBeenCalled();
    expect(ctx.paymentGateway.createCheckout).toHaveBeenCalledTimes(1);
    expect(ctx.bookingTransitions.expirePayment).toHaveBeenCalledWith("b1", NOW, "checkout-failed");
    expect(ctx.calls).toEqual(["tx:start", "flush", "tx:commit"]);
  });

  it("does not expire a booking for an unclassified checkout failure", async () => {
    ctx.paymentGateway.createCheckout.mockRejectedValue(new Error("unknown provider response"));

    await expect(ctx.service.create("u1", input)).rejects.toThrow("unknown provider response");

    expect(ctx.bookingTransitions.expirePayment).not.toHaveBeenCalled();
  });

  it("refuses a question over 2,000 characters before touching the database", async () => {
    await expect(ctx.service.create("u1", { ...input, question: "a".repeat(2001) })).rejects.toBeInstanceOf(ValidationError);

    expect(ctx.em.transactional).not.toHaveBeenCalled();
  });

  it("refuses an unknown entry point", async () => {
    await expect(ctx.service.create("u1", { ...input, entryPoint: "banner" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("refuses a slot that is not bookable and creates nothing", async () => {
    ctx.slotService.assertBookable.mockRejectedValue(new ConflictError("This time was just taken"));

    await expect(ctx.service.create("u1", input)).rejects.toBeInstanceOf(ConflictError);

    expect(ctx.tx.create).not.toHaveBeenCalled();
    expect(ctx.paymentGateway.createCheckout).not.toHaveBeenCalled();
  });

  it("refuses to book one's own slot", async () => {
    ctx.tx.count.mockResolvedValue(1);

    await expect(ctx.service.create("u1", input)).rejects.toBeInstanceOf(ForbiddenError);

    expect(ctx.tx.count).toHaveBeenCalledWith(MentorProfile, { id: "p1", user: "u1" });
    expect(ctx.tx.create).not.toHaveBeenCalled();
  });

  it("refuses when the mentor has no price and creates nothing", async () => {
    ctx.mentorService.priceFor.mockRejectedValue(new ConflictError("not set"));

    await expect(ctx.service.create("u1", input)).rejects.toBeInstanceOf(ConflictError);

    expect(ctx.tx.create).not.toHaveBeenCalled();
    expect(ctx.slot.status).toBe("open");
  });
});
