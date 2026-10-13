import { User } from "./auth/user.entity";

export { User, USER_ROLES, type IUser } from "./auth/user.entity";

// Every entity must be listed here – discovery is explicit so it works inside the Next.js bundle.
export const entities = [User];
