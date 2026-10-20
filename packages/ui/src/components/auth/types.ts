// Shapes from spec E01 (API Contracts). ui must not import core, so they are restated here (C1, C2).

/** `SessionUserDto`: the signed-in person as the header and guards see them. No email, no token. */
export type SessionUser = { id: string; name: string; role: "mentor" | "mentee" | "admin" };
