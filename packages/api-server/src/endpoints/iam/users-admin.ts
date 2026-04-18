import { UserRole } from "@repo/contracts/iam/auth";
import {
  type AdminUserListItem,
  type GetUsersPageDataResponse,
  type UpdateUserRoleData,
  type User,
} from "@repo/contracts/iam/user";
import { ConflictError, ForbiddenError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAdminUserListItem, mapToUser, ROLE_MAP, ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { findOrThrow, handlePrismaError } from "../../utils";

export const iamUserAdminApi = {
  getAll: async (): Promise<AdminUserListItem[]> => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return users.map(mapToAdminUserListItem);
  },

  getPageData: async (): Promise<GetUsersPageDataResponse> => {
    const users = await iamUserAdminApi.getAll();

    return { users };
  },

  updateRole: async (actorId: string, id: string, data: UpdateUserRoleData): Promise<User> => {
    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    const isDemotionFromAdmin =
      ROLE_MAP[existing.role] === UserRole.ADMIN && data.role !== UserRole.ADMIN;

    if (isDemotionFromAdmin && actorId === id) {
      throw new ForbiddenError("Cannot demote yourself from admin");
    }

    if (isDemotionFromAdmin) {
      const adminCount = await prisma.user.count({
        where: { role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] },
      });

      if (adminCount <= 1) {
        throw new ConflictError("Cannot remove the last admin");
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { role: ROLE_TO_PRISMA_MAP[data.role], tokenVersion: { increment: 1 } },
      });

      return mapToUser(user);
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },
};
