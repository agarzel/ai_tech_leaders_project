import { UniqueConstraintViolationException, User, type EntityManager, type IUser, type UserRole } from "@devmentor/db";
import type { CrudService, Page, PageQuery } from "../../http/crud";
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
  constructor(private readonly deps: { em: EntityManager }) {}

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

  async create(input: UserCreateInput): Promise<UserDto> {
    // Explicit fields only – the parsed input is never spread into the entity (no mass assignment).
    const user = this.deps.em.create(User, {
      name: input.name,
      email: normalizeEmail(input.email),
      role: input.role,
    });
    await this.flushOrConflict();
    return toUserDto(user);
  }

  async update(id: string, input: UserUpdateInput): Promise<UserDto> {
    const user = await this.findOrThrow(id);
    user.name = input.name;
    user.email = normalizeEmail(input.email);
    user.role = input.role;
    await this.flushOrConflict();
    return toUserDto(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findOrThrow(id);
    await this.deps.em.remove(user).flush();
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
