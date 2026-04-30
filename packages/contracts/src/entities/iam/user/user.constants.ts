import { UserRole } from "../auth";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.HEAD_COACH]: "Head Coach",
  [UserRole.COACH]: "Coach",
  [UserRole.ATHLETE]: "Athlete",
};
