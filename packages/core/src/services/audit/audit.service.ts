import { AuditEvent, User, type AuditAction, type AuditActorKind, type EntityManager } from "@devmentor/db";
import type { Clock } from "../../clock";
import type { Page } from "../../http/crud";
import { requireRole, type Session } from "../../http/auth";
import type { Logger } from "../../logger";
import type { AuditEventListQuery } from "../../validators/audit/audit-event-list.schema";

/** What a service hands to `record`: ids and roles only – never names, e-mails, passwords, tokens or IPs. */
export type AuditEntry = {
  action: AuditAction;
  actorKind: AuditActorKind;
  actorUserId: string | null;
  targetUserId: string | null;
  details?: Record<string, unknown>;
};

/** A user as the audit list shows them: resolved at read time, or marked deleted when the id no longer exists. */
export type AuditUserRef = { id: string; name: string; email: string } | { id: string; deleted: true };

export type AuditEventDto = {
  id: string;
  occurredAt: string;
  action: AuditAction;
  actorKind: AuditActorKind;
  actor: AuditUserRef | null;
  target: AuditUserRef | null;
  details: Record<string, unknown>;
};

/**
 * Append-only audit log of admin and operator actions (#119, threat model T-09).
 * `record` adds the row to the caller's unit of work, so it commits or rolls back with the change it describes;
 * `emit` logs the same entries once that flush has succeeded. Nothing here updates or deletes an entry.
 */
export class AuditService {
  constructor(private readonly deps: { em: EntityManager; clock: Clock; logger: Logger }) {}

  /** Queues the entry on `em` – the caller's next flush (or transaction) writes it together with the change. */
  record(em: EntityManager, entry: AuditEntry): AuditEntry {
    em.create(AuditEvent, {
      occurredAt: this.deps.clock.now(),
      actorKind: entry.actorKind,
      actorUserId: entry.actorUserId,
      action: entry.action,
      targetUserId: entry.targetUserId,
      details: entry.details ?? {},
    });
    return entry;
  }

  /** Logs entries that are already committed. Call only after the flush that wrote them succeeded. */
  emit(entries: AuditEntry[]): void {
    for (const entry of entries) this.deps.logger.info({ audit: { ...entry, details: entry.details ?? {} } }, "audit");
  }

  /** Newest first. Admin only – checked here as well as in the route. Names are resolved in one batched lookup. */
  async list(session: Session, query: AuditEventListQuery): Promise<Page<AuditEventDto>> {
    requireRole(session, "admin");
    const { page, pageSize, action, actorUserId } = query;
    const where = { ...(action ? { action } : {}), ...(actorUserId ? { actorUserId } : {}) };
    const [events, total] = await this.deps.em.findAndCount(AuditEvent, where, {
      orderBy: { occurredAt: "desc", id: "desc" },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const ids = [...new Set(events.flatMap((event) => [event.actorUserId, event.targetUserId]).filter((id): id is string => id !== null))];
    const users = ids.length ? await this.deps.em.find(User, { id: { $in: ids } }) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    const ref = (id: string | null | undefined): AuditUserRef | null => {
      if (!id) return null;
      const user = byId.get(id);
      return user ? { id, name: user.name, email: user.email } : { id, deleted: true };
    };

    const items = events.map((event) => ({
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      action: event.action,
      actorKind: event.actorKind,
      actor: ref(event.actorUserId),
      target: ref(event.targetUserId),
      details: event.details,
    }));
    return { items, total, page, pageSize };
  }
}
