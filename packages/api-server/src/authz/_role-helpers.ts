import { UserRole } from "@repo/contracts/iam/auth";

export const ADMIN_OR_HEAD_COACH: ReadonlySet<UserRole> = new Set([
  UserRole.ADMIN,
  UserRole.HEAD_COACH,
]);

export const isAdminOrHeadCoach = (role: UserRole): boolean => ADMIN_OR_HEAD_COACH.has(role);
