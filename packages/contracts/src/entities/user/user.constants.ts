import { UserRole } from "../auth";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.COACH]: "Coach",
  [UserRole.USER]: "User",
};
