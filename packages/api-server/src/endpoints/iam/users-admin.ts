import { UserRole } from "@repo/contracts/iam/auth";
import {
  type AdminUser,
  type AdminUserListItem,
  type GetUsersPageDataResponse,
  type UpdateUserRoleData,
} from "@repo/contracts/iam/user";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAdminUser, mapToAdminUserListItem } from "../../mappers";
import { ROLE_MAP, ROLE_TO_PRISMA_MAP } from "../../mappers/enum-maps";
import { findOrThrow, handlePrismaError } from "../../utils";

const includeWithProfiles = {
  athleteProfile: true,
  coachProfile: true,
} as const;

export const adminUsersApi = {
  getAll: async (): Promise<AdminUserListItem[]> => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return users.map(mapToAdminUserListItem);
  },

  getById: async (id: string): Promise<AdminUser> => {
    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id }, include: includeWithProfiles }),
      "User",
    );

    return mapToAdminUser(user);
  },

  getPageData: async (): Promise<GetUsersPageDataResponse> => {
    const users = await adminUsersApi.getAll();

    return { users };
  },

  updateRole: async (id: string, data: UpdateUserRoleData): Promise<AdminUser> => {
    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    if (ROLE_MAP[existing.role] === UserRole.ADMIN && data.role !== UserRole.ADMIN) {
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
        data: { role: ROLE_TO_PRISMA_MAP[data.role] },
        include: includeWithProfiles,
      });

      return mapToAdminUser(user);
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },
};
