import type { EntityManager, MikroORM } from "@devmentor/db";
import type { Logger } from "../logger";
import type { UserService } from "../services/auth/user.service";
import type { HealthService } from "../services/system/health.service";

// Every dependency registered in container.ts, by its camelCase key.
export type Cradle = {
  orm: MikroORM;
  em: EntityManager;
  logger: Logger;
  healthService: HealthService;
  userService: UserService;
};
