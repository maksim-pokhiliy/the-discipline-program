import {
  type AdminUser,
  type AdminUserListItem,
  type UpdateUserRoleData,
} from "@repo/contracts/user";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAdminUser, mapToAdminUserListItem } from "../../mappers";

const includeWithProfiles = {
  athleteProfile: true,
  coachProfile: true,
} as const;

export const adminUsersApi = {
  getAll: async (): Promise<AdminUserListItem[]> => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return users.map(mapToAdminUserListItem);
  },

  getById: async (id: string): Promise<AdminUser> => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: includeWithProfiles,
    });

    if (!user || user.deletedAt) {
      throw new NotFoundError("User not found", { id });
    }

    return mapToAdminUser(user);
  },

  getStats: async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, newThisMonth, users, coaches, admins] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: { createdAt: { gte: firstDayOfMonth }, deletedAt: null },
      }),
      prisma.user.count({ where: { role: "USER", deletedAt: null } }),
      prisma.user.count({ where: { role: "COACH", deletedAt: null } }),
      prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }),
    ]);

    return {
      total,
      newThisMonth,
      byRole: { user: users, coach: coaches, admin: admins },
    };
  },

  getPageData: async () => {
    const [stats, users] = await Promise.all([adminUsersApi.getStats(), adminUsersApi.getAll()]);

    return { stats, users };
  },

  updateRole: async (id: string, data: UpdateUserRoleData): Promise<AdminUser> => {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError("User not found", { id });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      include: includeWithProfiles,
    });

    return mapToAdminUser(user);
  },
};
