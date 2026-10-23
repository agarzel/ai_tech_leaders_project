import type { UserRole } from "@devmentor/db";
import type { AuthService, SessionUserDto } from "../services/auth/auth.service";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { SESSION_COOKIE_NAME } from "./session-cookie";

export type Session = SessionUserDto;

/** The authenticated user behind the request's session cookie; anything missing or invalid is `UnauthorizedError`. */
export async function requireSession(request: Request, authService: Pick<AuthService, "authenticate">): Promise<Session> {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  if (!token) throw new UnauthorizedError();
  return authService.authenticate(token);
}

export function requireRole(session: Session, ...roles: UserRole[]): void {
  if (!roles.includes(session.role)) throw new ForbiddenError();
}

/** Ownership check for per-record access; the role does not exempt anyone (admins included). */
export function assertOwner(session: Session, ownerId: string): void {
  if (session.id !== ownerId) throw new ForbiddenError();
}

function readCookie(header: string | null, name: string): string | undefined {
  const pair = header?.split(";").find((part) => part.trim().startsWith(`${name}=`));
  return pair?.trim().slice(name.length + 1) || undefined;
}

/** Admin-only access: a valid session whose role is `admin`. No bypass in any environment – anything else fails closed. */
export async function requireAdmin(request: Request, authService: Pick<AuthService, "authenticate">): Promise<Session> {
  const session = await requireSession(request, authService);
  requireRole(session, "admin");
  return session;
}
