import { UserRole } from "@repo/contracts/auth";
import {
  type AdminUser,
  type AdminUserListItem,
  type GetUsersPageDataResponse,
  type UpdateUserRoleData,
} from "@repo/contracts/user";
import { ConflictError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAdminUser, mapToAdminUserListItem } from "../../mappers";
import { handlePrismaError } from "../../utils";

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
    const user = await prisma.user.findUnique({
      where: { id },
      include: includeWithProfiles,
    });

    if (!user) {
      throw new NotFoundError("User not found", { id });
    }

    return mapToAdminUser(user);
  },

  getPageData: async (): Promise<GetUsersPageDataResponse> => {
    const users = await adminUsersApi.getAll();

    return { users };
  },

  updateRole: async (id: string, data: UpdateUserRoleData): Promise<AdminUser> => {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("User not found", { id });
    }

    if (existing.role === UserRole.ADMIN && data.role !== UserRole.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });

      if (adminCount <= 1) {
        throw new ConflictError("Cannot remove the last admin");
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { role: data.role },
        include: includeWithProfiles,
      });

      return mapToAdminUser(user);
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },
};
