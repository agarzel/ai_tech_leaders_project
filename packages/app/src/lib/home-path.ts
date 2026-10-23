import type { SessionUserDto } from "@devmentor/core";

/**
 * Where a person lands after signing in or registering, and where the role gates send someone who is in the
 * wrong place: admins in the admin panel, mentors in their workspace, everyone else on the home page.
 */
export function homePathFor(role: SessionUserDto["role"]): string {
  if (role === "admin") return "/admin";
  return role === "mentor" ? "/mentor" : "/";
}
