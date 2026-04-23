import { Role as PrismaRole } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";

export const ROLE_MAP: Record<PrismaRole, UserRole> = {
  ATHLETE: UserRole.ATHLETE,
  COACH: UserRole.COACH,
  ADMIN: UserRole.ADMIN,
};

export const ROLE_TO_PRISMA_MAP: Record<UserRole, PrismaRole> = {
  [UserRole.ATHLETE]: PrismaRole.ATHLETE,
  [UserRole.COACH]: PrismaRole.COACH,
  [UserRole.ADMIN]: PrismaRole.ADMIN,
};
