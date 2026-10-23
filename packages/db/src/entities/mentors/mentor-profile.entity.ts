import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { User } from "../auth/user.entity";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";

export const MentorProfile = defineSingletonEntity("MentorProfile", () =>
  defineEntity({
    name: "MentorProfile",
    tableName: "mentor_profiles",
    properties: {
      ...baseProperties(),
      // One profile per mentor; the display name is User.name. Deleting the user removes the profile.
      user: () => p.oneToOne(User).unique().deleteRule("cascade"),
      headline: p.string().length(120).nullable(),
      bio: p.text().nullable(),
      // Subset of MENTOR_TAGS, validated in the service.
      tags: p.json<string[]>().default("[]"),
      // Up to 5 https URLs, validated in the service.
      links: p.json<string[]>().default("[]"),
      // Integer grosze; null until the mentor sets them (fail closed: no price, not bookable).
      price25: p.integer().nullable(),
      price50: p.integer().nullable(),
      // Generated once when the profile is created; never regenerated.
      shareSlug: p.string().unique(),
      // Opt-in to the public list (R08).
      listed: p.boolean().default(false),
    },
  }),
);

export type IMentorProfile = InferEntity<typeof MentorProfile>;
