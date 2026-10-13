// Client-safe constants (no MikroORM import) – shared with validators and forms via @devmentor/db/constants.
export const USER_ROLES = ["mentor", "mentee", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];
