import { UserRole } from "@repo/contracts/iam/auth";
import {
  type AdminUserListItem,
  type CreateUserData,
  type GetUsersPageDataResponse,
  type UpdateUserData,
  type UpdateUserRoleData,
  type User,
} from "@repo/contracts/iam/user";
import { ConflictError, ForbiddenError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAdminUserListItem, mapToUser, ROLE_MAP, ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { findOrThrow, handlePrismaError } from "../../utils";

const assertNotLastAdminDemotion = async (): Promise<void> => {
  const adminCount = await prisma.user.count({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] },
  });

  if (adminCount <= 1) {
    throw new ConflictError("Cannot remove the last admin");
  }
};

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

  createUser: async (_actorId: string, data: CreateUserData): Promise<User> => {
    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: ROLE_TO_PRISMA_MAP[data.role],
          timezone: data.timezone,
          password: null,
          emailVerified: null,
        },
      });

      return mapToUser(user);
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },

  updateUser: async (actorId: string, id: string, data: UpdateUserData): Promise<User> => {
    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    const currentRole = ROLE_MAP[existing.role];
    const roleChanged = data.role !== undefined && data.role !== currentRole;
    const isDemotionFromAdmin =
      data.role !== undefined && currentRole === UserRole.ADMIN && data.role !== UserRole.ADMIN;

    if (isDemotionFromAdmin && actorId === id) {
      throw new ForbiddenError("Cannot demote yourself from admin");
    }

    if (isDemotionFromAdmin) {
      await assertNotLastAdminDemotion();
    }

    const updateData: {
      name?: string | null;
      role?: (typeof ROLE_TO_PRISMA_MAP)[UserRole];
      timezone?: string;
      tokenVersion?: { increment: number };
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.role !== undefined) {
      updateData.role = ROLE_TO_PRISMA_MAP[data.role];
    }

    if (data.timezone !== undefined) {
      updateData.timezone = data.timezone;
    }

    if (roleChanged) {
      updateData.tokenVersion = { increment: 1 };
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return mapToUser(user);
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },

  updateRole: async (actorId: string, id: string, data: UpdateUserRoleData): Promise<User> => {
    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    const isDemotionFromAdmin =
      ROLE_MAP[existing.role] === UserRole.ADMIN && data.role !== UserRole.ADMIN;

    if (isDemotionFromAdmin && actorId === id) {
      throw new ForbiddenError("Cannot demote yourself from admin");
    }

    if (isDemotionFromAdmin) {
      await assertNotLastAdminDemotion();
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

  deleteUser: async (actorId: string, id: string): Promise<void> => {
    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    if (actorId === id) {
      throw new ForbiddenError("Cannot delete yourself");
    }

    if (ROLE_MAP[existing.role] === UserRole.ADMIN) {
      await assertNotLastAdminDemotion();
    }

    try {
      await prisma.user.delete({ where: { id } });
      await prisma.user.update({
        where: { id },
        data: { tokenVersion: { increment: 1 } },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },
};
