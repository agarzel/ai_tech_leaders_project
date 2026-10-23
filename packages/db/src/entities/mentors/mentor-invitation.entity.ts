import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { User } from "../auth/user.entity";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";

export const MentorInvitation = defineSingletonEntity("MentorInvitation", () =>
  defineEntity({
    name: "MentorInvitation",
    tableName: "mentor_invitations",
    properties: {
      ...baseProperties(),
      // Normalized (trimmed, lower-case). Not unique: re-inviting creates a new row and revokes the old one.
      email: p.string().index(),
      // SHA-256 (hex) of the random link token. The token itself is shown once and never stored.
      tokenHash: p.string().unique(),
      expiresAt: p.datetime(),
      usedAt: p.datetime().nullable(),
      // Set when a newer invitation for the same email supersedes this one.
      revokedAt: p.datetime().nullable(),
      // Nullable with `set null`: deleting the issuing admin must not fail on this foreign key.
      createdBy: () => p.manyToOne(User).nullable().deleteRule("set null"),
      usedBy: () => p.manyToOne(User).nullable(),
    },
  }),
);

export type IMentorInvitation = InferEntity<typeof MentorInvitation>;
