// Shape from spec E01 (API Contracts, `GET, POST /api/mentor/slots`; owner decision Q9, 2026-10-20).
// ui must not import core, so it is restated here (C1, C2).

/**
 * `SlotDto`: `startsAt` is an ISO UTC string; `bookable` is computed by the server with the same rule as
 * `SlotService.listBookable` (open and starting at least 24 h ahead, D13), so the UI never re-implements it.
 */
export type Slot = { id: string; startsAt: string; status: "open" | "booked"; bookable: boolean };
