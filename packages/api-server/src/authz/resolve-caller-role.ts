import { getRole } from "@repo/api-routes";
import { UserRole } from "@repo/contracts/iam/auth";

import { prisma } from "../db/client";
import { ROLE_MAP } from "../mappers/iam";

const isUserRole = (value: string | undefined): value is UserRole =>
  value !== undefined && (Object.values(UserRole) as string[]).includes(value);

export const resolveCallerRole = async (userId: string): Promise<UserRole | null> => {
  const contextRole = getRole();

  if (isUserRole(contextRole)) {
    return contextRole;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user ? ROLE_MAP[user.role] : null;
};
