// Entry point safe for client bundles: constants only, nothing that imports @mikro-orm/*.
export { USER_ROLES, type UserRole } from "./entities/auth/user.constants";

// Bookable text-session lengths in minutes (R01).
export const SESSION_LENGTHS = [25, 50] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];

// Prices are PLN only, stored in grosze (D12).
export const CURRENCY = "PLN";

// Stack tags a mentor can pick on the profile.
export const MENTOR_TAGS = ["TypeScript", "React", "Python", "AI agents"] as const;
export type MentorTag = (typeof MENTOR_TAGS)[number];
