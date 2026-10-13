import { User } from "./user.entity";

export { User };

// Every entity must be listed here – discovery is explicit so it works inside the Next.js bundle.
export const entities = [User];
