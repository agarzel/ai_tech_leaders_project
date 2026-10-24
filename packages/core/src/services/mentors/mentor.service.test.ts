import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_LEAD_TIME_HOURS, MentorProfile, Slot, UniqueConstraintViolationException, User, type EntityManager } from "@devmentor/db";
import { FakeClock } from "../../testing/fake-clock";
import { SLOT_HORIZON_DAYS } from "../availability/slot.service";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import type { MentorProfileInput } from "../../validators/mentors/mentor-profile.schema";
import { MentorService, SLUG_MAX_ATTEMPTS } from "./mentor.service";

function makeEm() {
  const em = {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    flush: vi.fn(),
    getReference: vi.fn((entity: unknown, id: string) => ({ ref: id })),
    fork: vi.fn(),
  };
  // The fork used for an insert attempt is a separate mock, so a failed attempt cannot leak into the main one.
  em.fork.mockImplementation(() => ({ create: em.create, flush: em.flush, getReference: em.getReference }));
  return em;
}

const collision = () => new UniqueConstraintViolationException(new Error("duplicate key"));

function storedProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    user: { id: "u1", name: "Ada Lovelace" },
    headline: null,
    bio: null,
    tags: [],
    links: [],
    price25: null,
    price50: null,
    shareSlug: "ada-lovelace-abc123",
    listed: false,
    ...overrides,
  };
}

const input: MentorProfileInput = {
  name: "Ada Byron",
  headline: "Staff engineer",
  bio: "I debug distributed systems.",
  tags: ["TypeScript", "AI agents"],
  links: ["https://github.com/ada"],
  price25: 8000,
  price50: 15000,
  listed: false,
};

let em: ReturnType<typeof makeEm>;
let service: MentorService;
let clock: FakeClock;

beforeEach(() => {
  em = makeEm();
  clock = new FakeClock(new Date("2026-03-01T10:00:00Z"));
  service = new MentorService({ em: em as unknown as EntityManager, clock });
});

describe("MentorService.getOrCreateOwn", () => {
  it("returns the existing profile without creating another", async () => {
    em.findOne.mockResolvedValueOnce(storedProfile({ headline: "Engineer", bio: "Hi", price25: 8000, listed: true }));

    const dto = await service.getOrCreateOwn("u1");

    expect(em.create).not.toHaveBeenCalled();
    expect(dto).toEqual({
      id: "p1",
      name: "Ada Lovelace",
      headline: "Engineer",
      bio: "Hi",
      tags: [],
      links: [],
      price25: 8000,
      price50: null,
      currency: "PLN",
      shareSlug: "ada-lovelace-abc123",
      listed: true,
    });
  });

  it("looks the profile up by the session user id", async () => {
    em.findOne.mockResolvedValueOnce(storedProfile());

    await service.getOrCreateOwn("u1");

    expect(em.findOne).toHaveBeenCalledWith(MentorProfile, { user: "u1" }, { populate: ["user"] });
  });

  it("creates the profile on first access with a slug built from the name", async () => {
    em.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", name: "Ada Lovelace" });
    em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({ id: "p1", ...data }));

    const dto = await service.getOrCreateOwn("u1");

    expect(em.create).toHaveBeenCalledOnce();
    expect(em.create.mock.calls[0]![0]).toBe(MentorProfile);
    expect(em.getReference).toHaveBeenCalledWith(User, "u1");
    expect(dto.shareSlug).toMatch(/^ada-lovelace-[a-z0-9]{6}$/);
    expect(dto).toMatchObject({ id: "p1", name: "Ada Lovelace", headline: null, tags: [], links: [], price25: null, price50: null, listed: false });
  });

  it("makes an ASCII, URL-safe slug from names with accents, symbols or no letters", async () => {
    const slugFor = async (name: string) => {
      em.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", name });
      em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({ id: "p1", ...data }));
      return (await service.getOrCreateOwn("u1")).shareSlug;
    };

    expect(await slugFor("Zażółć Gęślą  Jaźń!")).toMatch(/^zazolc-gesla-jazn-[a-z0-9]{6}$/);
    expect(await slugFor("日本語")).toMatch(/^mentor-[a-z0-9]{6}$/);
    expect(await slugFor(`${"a".repeat(39)} bbbb`)).toMatch(/^a{39}-[a-z0-9]{6}$/);
  });

  it("generates a different slug suffix each time", async () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 5; i++) {
      em.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", name: "Ada" });
      em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({ id: "p1", ...data }));
      slugs.add((await service.getOrCreateOwn("u1")).shareSlug);
    }

    expect(slugs.size).toBeGreaterThan(1);
  });

  it("fails with not found for an unknown user", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.getOrCreateOwn("ghost")).rejects.toBeInstanceOf(NotFoundError);
    expect(em.create).not.toHaveBeenCalled();
  });

  it("retries with a new slug after a slug collision", async () => {
    em.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", name: "Ada" }).mockResolvedValueOnce(null);
    em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({ id: "p1", ...data }));
    em.flush.mockRejectedValueOnce(collision()).mockResolvedValueOnce(undefined);

    const dto = await service.getOrCreateOwn("u1");

    expect(em.create).toHaveBeenCalledTimes(2);
    const [first, second] = em.create.mock.calls.map((call) => (call[1] as { shareSlug: string }).shareSlug);
    expect(first).not.toBe(second);
    expect(dto.shareSlug).toBe(second);
  });

  it("returns the profile a parallel first visit created instead of failing", async () => {
    em.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "u1", name: "Ada" })
      .mockResolvedValueOnce(storedProfile({ shareSlug: "ada-from-parallel" }));
    em.create.mockReturnValue({});
    em.flush.mockRejectedValue(collision());

    const dto = await service.getOrCreateOwn("u1");

    expect(dto.shareSlug).toBe("ada-from-parallel");
    expect(em.create).toHaveBeenCalledOnce();
  });

  it("fails closed with a conflict after the maximum number of slug collisions", async () => {
    em.findOne.mockImplementation(async (entity: unknown) => (entity === User ? { id: "u1", name: "Ada" } : null));
    em.create.mockReturnValue({});
    em.flush.mockRejectedValue(collision());

    await expect(service.getOrCreateOwn("u1")).rejects.toBeInstanceOf(ConflictError);
    expect(em.create).toHaveBeenCalledTimes(SLUG_MAX_ATTEMPTS);
  });

  it("rethrows unexpected database errors without retrying", async () => {
    em.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", name: "Ada" });
    em.create.mockReturnValue({});
    em.flush.mockRejectedValue(new Error("connection lost"));

    await expect(service.getOrCreateOwn("u1")).rejects.toThrow("connection lost");
    expect(em.create).toHaveBeenCalledOnce();
  });
});

describe("MentorService.updateOwn", () => {
  it("saves headline, bio, tags, links, prices and the display name on the caller's own profile", async () => {
    const profile = storedProfile();
    em.findOne.mockResolvedValue(profile);

    const dto = await service.updateOwn("u1", input);

    expect(em.findOne).toHaveBeenCalledWith(MentorProfile, { user: "u1" }, { populate: ["user"] });
    expect(em.flush).toHaveBeenCalledOnce();
    expect(profile).toMatchObject({
      headline: "Staff engineer",
      bio: "I debug distributed systems.",
      tags: ["TypeScript", "AI agents"],
      links: ["https://github.com/ada"],
      price25: 8000,
      price50: 15000,
    });
    expect(profile.user.name).toBe("Ada Byron");
    expect(dto).toMatchObject({ name: "Ada Byron", headline: "Staff engineer", price25: 8000, price50: 15000, currency: "PLN" });
  });

  it("lists the caller's own profile when both prices are set", async () => {
    const profile = storedProfile();
    em.findOne.mockResolvedValue(profile);

    const dto = await service.updateOwn("u1", { ...input, listed: true });

    expect(profile.listed).toBe(true);
    expect(dto.listed).toBe(true);
  });

  it("unlists a listed profile when the caller opts out", async () => {
    const profile = storedProfile({ price25: 8000, price50: 15000, listed: true });
    em.findOne.mockResolvedValue(profile);

    const dto = await service.updateOwn("u1", { ...input, listed: false });

    expect(dto.listed).toBe(false);
  });

  it.each([
    { price25: null, price50: 15000 },
    { price25: 8000, price50: null },
  ])("refuses to list without both prices and changes nothing ($price25, $price50)", async (prices) => {
    const profile = storedProfile();
    em.findOne.mockResolvedValue(profile);

    const attempt = service.updateOwn("u1", { ...input, ...prices, listed: true });

    await expect(attempt).rejects.toBeInstanceOf(ValidationError);
    await expect(attempt).rejects.toMatchObject({ fieldErrors: { listed: ["Set both prices before joining the public list."] } });
    expect(em.flush).not.toHaveBeenCalled();
    expect(profile.listed).toBe(false);
  });

  it("keeps prices unset when the caller sends none", async () => {
    const profile = storedProfile({ price25: 8000, price50: 15000 });
    em.findOne.mockResolvedValue(profile);

    const dto = await service.updateOwn("u1", { ...input, price25: null, price50: null });

    expect(dto).toMatchObject({ price25: null, price50: null });
  });

  it("creates the profile first when the mentor has none yet", async () => {
    const profile = storedProfile();
    em.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", name: "Ada" }).mockResolvedValueOnce(profile);
    em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({ id: "p1", ...data }));

    const dto = await service.updateOwn("u1", input);

    expect(em.create).toHaveBeenCalledOnce();
    expect(dto.headline).toBe("Staff engineer");
  });

  it("fails closed when the profile cannot be found after it was created", async () => {
    em.findOne.mockResolvedValueOnce(storedProfile()).mockResolvedValueOnce(null);

    await expect(service.updateOwn("u1", input)).rejects.toBeInstanceOf(NotFoundError);
    expect(em.flush).not.toHaveBeenCalled();
  });
});

const HOUR_MS = 3_600_000;
const inHours = (hours: number) => new Date(clock.now().getTime() + hours * HOUR_MS);

function publicSlot(profile: Record<string, unknown>, startsAt: Date, id = `s-${startsAt.getTime()}`) {
  return { id, mentor: profile, startsAt, status: "open" };
}

function listedProfile(id: string, overrides: Record<string, unknown> = {}) {
  return storedProfile({ id, user: { id: `u-${id}`, name: `Mentor ${id}`, email: `${id}@example.com`, role: "mentor" }, shareSlug: `mentor-${id}`, price25: 8000, price50: 15000, listed: true, ...overrides });
}

const listQuery = { page: 1, pageSize: 12 };

describe("MentorService.listPublic", () => {
  it("returns a listed mentor with prices and a bookable slot", async () => {
    const ada = listedProfile("a", { headline: "Staff engineer", bio: "Hi", tags: ["React"], links: ["https://github.com/ada"] });
    em.find.mockResolvedValueOnce([publicSlot(ada, inHours(30))]);

    const result = await service.listPublic(listQuery);

    expect(result).toEqual({
      page: 1,
      pageSize: 12,
      total: 1,
      items: [
        {
          name: "Mentor a",
          headline: "Staff engineer",
          bio: "Hi",
          tags: ["React"],
          links: ["https://github.com/ada"],
          price25: 8000,
          price50: 15000,
          currency: "PLN",
          shareSlug: "mentor-a",
          soonestBookableSlotAt: inHours(30).toISOString(),
        },
      ],
    });
  });

  it("asks the database only for listed mentors with both prices and open slots", async () => {
    em.find.mockResolvedValueOnce([]);

    await service.listPublic(listQuery);

    expect(em.find).toHaveBeenCalledWith(
      Slot,
      expect.objectContaining({ status: "open", mentor: { listed: true, price25: { $ne: null }, price50: { $ne: null } } }),
      expect.objectContaining({ orderBy: { startsAt: "asc" } }),
    );
  });

  it("limits slots to the bookable window computed from the injected clock", async () => {
    em.find.mockResolvedValueOnce([]);

    await service.listPublic(listQuery);

    const [, where] = em.find.mock.calls[0] as [unknown, { startsAt: { $gte: Date; $lte: Date } }];
    expect(where.startsAt.$gte).toEqual(inHours(BOOKING_LEAD_TIME_HOURS));
    expect(where.startsAt.$lte).toEqual(inHours(SLOT_HORIZON_DAYS * 24));
  });

  it("returns an empty page when no mentor has a bookable slot", async () => {
    em.find.mockResolvedValueOnce([]);

    expect(await service.listPublic(listQuery)).toEqual({ page: 1, pageSize: 12, total: 0, items: [] });
  });

  it("orders mentors by their soonest bookable slot and lists each mentor once", async () => {
    const a = listedProfile("a");
    const b = listedProfile("b");
    em.find.mockResolvedValueOnce([publicSlot(b, inHours(30)), publicSlot(a, inHours(40)), publicSlot(b, inHours(50))]);

    const result = await service.listPublic(listQuery);

    expect(result.items.map((item) => item.shareSlug)).toEqual(["mentor-b", "mentor-a"]);
    expect(result.items[0]?.soonestBookableSlotAt).toBe(inHours(30).toISOString());
  });

  it("applies the tag filter", async () => {
    const react = listedProfile("a", { tags: ["React", "Python"] });
    const ts = listedProfile("b", { tags: ["TypeScript"] });
    em.find.mockResolvedValueOnce([publicSlot(react, inHours(30)), publicSlot(ts, inHours(31))]);

    const result = await service.listPublic({ ...listQuery, tag: "Python" });

    expect(result.items.map((item) => item.shareSlug)).toEqual(["mentor-a"]);
    expect(result.total).toBe(1);
  });

  it("treats a mentor without tags as not matching a tag filter", async () => {
    const untagged = listedProfile("a", { tags: undefined });
    em.find.mockResolvedValueOnce([publicSlot(untagged, inHours(30))]);

    expect((await service.listPublic({ ...listQuery, tag: "React" })).items).toEqual([]);
  });

  it("pages the result and reports the total", async () => {
    const profiles = ["a", "b", "c"].map((id) => listedProfile(id));
    em.find.mockResolvedValueOnce(profiles.map((profile, index) => publicSlot(profile, inHours(30 + index))));

    const result = await service.listPublic({ page: 2, pageSize: 2 });

    expect(result.items.map((item) => item.shareSlug)).toEqual(["mentor-c"]);
    expect(result).toMatchObject({ page: 2, pageSize: 2, total: 3 });
  });

  it("fills the optional fields of a sparse profile", async () => {
    const sparse = listedProfile("a", { headline: undefined, bio: undefined, tags: undefined, links: undefined, price25: undefined, price50: undefined });
    em.find.mockResolvedValueOnce([publicSlot(sparse, inHours(30))]);

    const [item] = (await service.listPublic(listQuery)).items;

    expect(item).toMatchObject({ headline: null, bio: null, tags: [], links: [], price25: null, price50: null });
  });

  it("exposes no e-mail, user id, role, profile id or rating field", async () => {
    em.find.mockResolvedValueOnce([publicSlot(listedProfile("a"), inHours(30))]);

    const [item] = (await service.listPublic(listQuery)).items;

    expect(Object.keys(item ?? {}).sort()).toEqual(
      ["bio", "currency", "headline", "links", "name", "price25", "price50", "shareSlug", "soonestBookableSlotAt", "tags"].sort(),
    );
  });
});

describe("MentorService.getPublicBySlug", () => {
  it("returns an unlisted mentor by link with the bookable slots", async () => {
    em.findOne.mockResolvedValueOnce(listedProfile("a", { listed: false }));
    em.find.mockResolvedValueOnce([publicSlot({}, inHours(30), "s1"), publicSlot({}, inHours(54), "s2")]);

    const result = await service.getPublicBySlug("mentor-a");

    expect(em.findOne).toHaveBeenCalledWith(MentorProfile, { shareSlug: "mentor-a" }, { populate: ["user"] });
    expect(result.shareSlug).toBe("mentor-a");
    expect(result.soonestBookableSlotAt).toBe(inHours(30).toISOString());
    expect(result.slots).toEqual([
      { id: "s1", startsAt: inHours(30).toISOString(), status: "open", bookable: true },
      { id: "s2", startsAt: inHours(54).toISOString(), status: "open", bookable: true },
    ]);
  });

  it("queries only the bookable window of that mentor", async () => {
    em.findOne.mockResolvedValueOnce(listedProfile("a"));
    em.find.mockResolvedValueOnce([]);

    await service.getPublicBySlug("mentor-a");

    const [, where] = em.find.mock.calls[0] as [unknown, { mentor: string; status: string; startsAt: { $gte: Date; $lte: Date } }];
    expect(where.mentor).toBe("a");
    expect(where.status).toBe("open");
    expect(where.startsAt.$gte).toEqual(inHours(BOOKING_LEAD_TIME_HOURS));
    expect(where.startsAt.$lte).toEqual(inHours(SLOT_HORIZON_DAYS * 24));
  });

  it("returns an empty slot list and no soonest slot when nothing is bookable", async () => {
    em.findOne.mockResolvedValueOnce(listedProfile("a"));
    em.find.mockResolvedValueOnce([]);

    const result = await service.getPublicBySlug("mentor-a");

    expect(result.slots).toEqual([]);
    expect(result.soonestBookableSlotAt).toBeNull();
  });

  it("returns no slots for a mentor without prices, without querying slots", async () => {
    em.findOne.mockResolvedValueOnce(listedProfile("a", { price50: null }));

    const result = await service.getPublicBySlug("mentor-a");

    expect(result.slots).toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for an unknown slug", async () => {
    em.findOne.mockResolvedValueOnce(null);

    await expect(service.getPublicBySlug("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("exposes no e-mail, user id, role or profile id", async () => {
    em.findOne.mockResolvedValueOnce(listedProfile("a"));
    em.find.mockResolvedValueOnce([]);

    const result = await service.getPublicBySlug("mentor-a");

    expect(Object.keys(result).sort()).toEqual(
      ["bio", "currency", "headline", "links", "name", "price25", "price50", "shareSlug", "slots", "soonestBookableSlotAt", "tags"].sort(),
    );
  });
});
