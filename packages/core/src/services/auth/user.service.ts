import { UniqueConstraintViolationException, User, type EntityManager, type IUser, type UserRole } from "@devmentor/db";
import type { CrudContext, CrudService, Page, PageQuery } from "../../http/crud";
import type { AuditService } from "../audit/audit.service";
import { ConflictError, NotFoundError } from "../../http/errors";
import type { UserCreateInput } from "../../validators/auth/user-create.schema";
import type { UserUpdateInput } from "../../validators/auth/user-update.schema";

/** What the API returns – never the entity itself. */
export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export class UserService implements CrudService<UserDto, UserCreateInput, UserUpdateInput> {
  constructor(private readonly deps: { em: EntityManager; auditService: Pick<AuditService, "record" | "emit"> }) {}

  async list({ page, pageSize }: PageQuery): Promise<Page<UserDto>> {
    const [users, total] = await this.deps.em.findAndCount(
      User,
      {},
      { orderBy: { createdAt: "desc" }, limit: pageSize, offset: (page - 1) * pageSize },
    );
    return { items: users.map(toUserDto), total, page, pageSize };
  }

  async get(id: string): Promise<UserDto> {
    return toUserDto(await this.findOrThrow(id));
  }

  /** Admin create, audited in the same flush with the role it grants (#119) – an admin account can be made here. */
  async create(input: UserCreateInput, context: CrudContext): Promise<UserDto> {
    const actorUserId = requireActor(context, "create");
    // Explicit fields only – the parsed input is never spread into the entity (no mass assignment).
    const user = this.deps.em.create(User, {
      name: input.name,
      email: normalizeEmail(input.email),
      role: input.role,
    });
    const entry = this.deps.auditService.record(this.deps.em, { action: "user.created", actorKind: "admin", actorUserId, targetUserId: user.id, details: { role: input.role } });
    await this.flushOrConflict();
    this.deps.auditService.emit([entry]);
    return toUserDto(user);
  }

  /** Admin edit. A role change is audited in the same flush (#119); name and e-mail edits are not. */
  async update(id: string, input: UserUpdateInput, context: CrudContext): Promise<UserDto> {
    const actorUserId = requireActor(context, "update");
    const user = await this.findOrThrow(id);
    const previousRole = user.role;
    user.name = input.name;
    user.email = normalizeEmail(input.email);
    user.role = input.role;
    const entries =
      previousRole === input.role
        ? []
        : [this.deps.auditService.record(this.deps.em, { action: "user.role_changed", actorKind: "admin", actorUserId, targetUserId: user.id, details: { from: previousRole, to: input.role } })];
    await this.flushOrConflict();
    this.deps.auditService.emit(entries);
    return toUserDto(user);
  }

  /** Admin delete, audited in the same flush (#119). The entry keeps the id – no foreign key, so history survives. */
  async delete(id: string, context: CrudContext): Promise<void> {
    const actorUserId = requireActor(context, "delete");
    const user = await this.findOrThrow(id);
    this.deps.em.remove(user);
    const entry = this.deps.auditService.record(this.deps.em, { action: "user.deleted", actorKind: "admin", actorUserId, targetUserId: user.id, details: { role: user.role } });
    await this.deps.em.flush();
    this.deps.auditService.emit([entry]);
  }

  private async findOrThrow(id: string): Promise<IUser> {
    const user = await this.deps.em.findOne(User, { id });
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  private async flushOrConflict(): Promise<void> {
    try {
      await this.deps.em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictError("A user with this email already exists", {
          email: ["A user with this email already exists"],
        });
      }
      throw error;
    }
  }
}

/** Every admin write must say who acts; makeCrudRoute always passes it. Failing here keeps unattributed changes out. */
function requireActor(context: CrudContext | undefined, method: "create" | "update" | "delete"): string {
  if (!context?.actorUserId) throw new Error(`UserService.${method} needs the acting admin`);
  return context.actorUserId;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUserDto(user: IUser): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
