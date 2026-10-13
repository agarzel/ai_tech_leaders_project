import { defineEntity, p, type InferEntity } from "@mikro-orm/core";

export const USER_ROLES = ["mentor", "mentee", "admin"] as const;

export const User = defineEntity({
  name: "User",
  properties: {
    id: p.uuid().primary().onCreate(() => crypto.randomUUID()),
    email: p.string().unique(),
    name: p.string(),
    role: p.enum(USER_ROLES).default("mentee"),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export type IUser = InferEntity<typeof User>;
