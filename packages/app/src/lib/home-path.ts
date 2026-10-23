import type { SessionUserDto } from "@devmentor/core";

/** Where a person lands after signing in or registering: admins in the admin panel, everyone else on the home page. */
export function homePathFor(role: SessionUserDto["role"]): string {
  return role === "admin" ? "/admin" : "/";
}
