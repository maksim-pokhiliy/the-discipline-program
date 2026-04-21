import { UserRole } from "@repo/contracts/iam/auth";
import {
  type AdminUserListItem,
  type CreateUserData,
  type GetUsersPageDataResponse,
  type UpdateUserData,
  type UpdateUserRoleData,
  type User,
} from "@repo/contracts/iam/user";
import { baseEnv } from "@repo/env/base";
import { BadRequestError, ConflictError, ForbiddenError, TooManyRequestsError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAdminUserListItem, mapToUser, ROLE_MAP, ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { findOrThrow, handlePrismaError } from "../../utils";

import {
  assertCoachesExist,
  closeAthleteActionItemsBulk,
  closeCoachActionItemsBulk,
  syncAthleteAssignments,
  type TxClient,
} from "./assignment-sync";
import { iamInviteTokenApi } from "./invite-token";
import { resolveInviteEmailConfig, sendInvitationEmail } from "./send-invitation-email";

const MS_PER_HOUR = 3_600_000;
const MAX_RESENDS_PER_DAY = 3;

const dedupe = <T>(xs: T[]): T[] => Array.from(new Set(xs));

const applyRoleExit = async (tx: TxClient, userId: string, role: UserRole): Promise<void> => {
  switch (role) {
    case UserRole.ATHLETE: {
      await closeAthleteActionItemsBulk(tx, userId);
      await tx.coachAthleteAssignment.deleteMany({ where: { athleteId: userId } });

      return;
    }
    case UserRole.COACH: {
      await closeCoachActionItemsBulk(tx, userId);
      await tx.coachProfile.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await tx.coachAthleteAssignment.deleteMany({ where: { coach: { userId } } });

      return;
    }
    case UserRole.ADMIN:
      return;
    default: {
      const exhaustive: never = role;

      return exhaustive;
    }
  }
};

const applyRoleEnter = async (
  tx: TxClient,
  userId: string,
  role: UserRole,
  coachIds: string[] | undefined,
): Promise<void> => {
  if (role !== UserRole.ATHLETE) {
    return;
  }

  await tx.athleteProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  if (coachIds !== undefined) {
    await syncAthleteAssignments(tx, userId, dedupe(coachIds));
  }
};

const assertNotLastAdminDemotion = async (): Promise<void> => {
  const adminCount = await prisma.user.count({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] },
  });

  if (adminCount <= 1) {
    throw new ConflictError("Cannot remove the last admin");
  }
};

const issueInviteAndSendEmail = async (
  actorId: string,
  recipient: { id: string; email: string; name: string | null },
): Promise<{ expiresAt: Date }> => {
  const { plainToken, expiresAt } = await iamInviteTokenApi.issue({
    userId: recipient.id,
    createdByAdminId: actorId,
  });

  const expiresInHours = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / MS_PER_HOUR));

  await sendInvitationEmail({
    userId: recipient.id,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    plainToken,
    expiresInHours,
  });

  return { expiresAt };
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

  createUser: async (actorId: string, data: CreateUserData): Promise<User> => {
    if (baseEnv.FEATURE_USER_INVITE_ENABLED) {
      resolveInviteEmailConfig();
    }

    if (data.coachIds.length > 0 && data.role !== UserRole.ATHLETE) {
      throw new BadRequestError("coach assignments are valid only for ATHLETE role");
    }

    const coachIds = dedupe(data.coachIds);

    let user: User;

    try {
      user = await prisma.$transaction(async (tx) => {
        if (coachIds.length > 0) {
          await assertCoachesExist(tx, coachIds);
        }

        const row = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            role: ROLE_TO_PRISMA_MAP[data.role],
            timezone: data.timezone,
            password: null,
            emailVerified: null,
          },
        });

        await applyRoleEnter(tx, row.id, data.role, coachIds);

        return mapToUser(row);
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }

    if (baseEnv.FEATURE_USER_INVITE_ENABLED) {
      await issueInviteAndSendEmail(actorId, {
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }

    return user;
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

    const newRole: UserRole = data.role ?? currentRole;

    if (data.coachIds !== undefined && data.coachIds.length > 0 && newRole !== UserRole.ATHLETE) {
      throw new BadRequestError("coach assignments are valid only for ATHLETE role");
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
      return await prisma.$transaction(async (tx) => {
        if (data.coachIds !== undefined && data.coachIds.length > 0) {
          await assertCoachesExist(tx, dedupe(data.coachIds));
        }

        const updatedRow = await tx.user.update({
          where: { id },
          data: updateData,
        });

        if (roleChanged) {
          await applyRoleExit(tx, id, currentRole);
        }

        await applyRoleEnter(tx, id, newRole, data.coachIds);

        return mapToUser(updatedRow);
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },

  updateRole: async (actorId: string, id: string, data: UpdateUserRoleData): Promise<User> => {
    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    const currentRole = ROLE_MAP[existing.role];
    const newRole = data.role;
    const roleChanged = currentRole !== newRole;

    const isDemotionFromAdmin = currentRole === UserRole.ADMIN && newRole !== UserRole.ADMIN;

    if (isDemotionFromAdmin && actorId === id) {
      throw new ForbiddenError("Cannot demote yourself from admin");
    }

    if (isDemotionFromAdmin) {
      await assertNotLastAdminDemotion();
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data: { role: ROLE_TO_PRISMA_MAP[newRole], tokenVersion: { increment: 1 } },
        });

        if (roleChanged) {
          await applyRoleExit(tx, id, currentRole);
          await applyRoleEnter(tx, id, newRole, undefined);
        }

        return mapToUser(updated);
      });
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

    const deletedAt = new Date();
    const suffixedEmail = `${existing.email}_deleted_${deletedAt.getTime()}`;

    try {
      await prisma.user.update({
        where: { id },
        data: {
          deletedAt,
          email: suffixedEmail,
          tokenVersion: { increment: 1 },
        },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },

  resendInvite: async (actorId: string, userId: string): Promise<{ expiresAt: Date }> => {
    if (!baseEnv.FEATURE_USER_INVITE_ENABLED) {
      throw new BadRequestError("Invite flow is disabled");
    }

    const user = await findOrThrow(prisma.user.findUnique({ where: { id: userId } }), "User");

    if (user.password !== null) {
      throw new ConflictError("User has already set a password — invite cannot be resent");
    }

    resolveInviteEmailConfig();

    const since = new Date(Date.now() - 24 * MS_PER_HOUR);
    const recentTokenCount = await prisma.userInviteToken.count({
      where: { userId, createdAt: { gte: since } },
    });

    if (recentTokenCount >= MAX_RESENDS_PER_DAY) {
      throw new TooManyRequestsError("Too many resends in 24 hours");
    }

    return issueInviteAndSendEmail(actorId, {
      id: user.id,
      email: user.email,
      name: user.name,
    });
  },
};
