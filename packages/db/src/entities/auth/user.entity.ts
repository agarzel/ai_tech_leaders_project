import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { baseProperties } from "../base.entity";
import { USER_ROLES } from "./user.constants";

export const User = defineEntity({
  name: "User",
  tableName: "users",
  properties: {
    ...baseProperties(),
    email: p.string().unique(),
    name: p.string(),
    role: p.enum(USER_ROLES).default("mentee"),
  },
});

export type IUser = InferEntity<typeof User>;
