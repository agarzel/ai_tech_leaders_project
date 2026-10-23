import { User } from "./auth/user.entity";
import { MentorInvitation } from "./mentors/mentor-invitation.entity";

export { User, type IUser } from "./auth/user.entity";
export { MentorInvitation, type IMentorInvitation } from "./mentors/mentor-invitation.entity";
export { USER_ROLES, type UserRole } from "./auth/user.constants";

// Every entity must be listed here – discovery is explicit so it works inside the Next.js bundle.
export const entities = [User, MentorInvitation];
