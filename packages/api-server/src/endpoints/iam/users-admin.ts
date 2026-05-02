import { UserRole } from "@repo/contracts/iam/auth";
import {
  type AdminUserListItem,
  type CreateUserData,
  type GetUsersPageDataResponse,
  type UpdateUserData,
  type UpdateUserRoleData,
  type User,
} from "@repo/contracts/iam/user";
import { BadRequestError, ConflictError, ForbiddenError, TooManyRequestsError } from "@repo/errors";

import { requireAdminStrict } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToAdminUserListItem, mapToUser, ROLE_MAP, ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { findOrThrow, handlePrismaError } from "../../utils";
import { DEFAULT_LIST_LIMIT } from "../../utils/list-limits";

import { assertCoachesExist, syncAthleteAssignments } from "./assignment-sync";
import { iamInviteTokenApi } from "./invite-token";
import { resolveInviteEmailConfig, sendInvitationEmail } from "./send-invitation-email";
import { iamUserCreationApi } from "./user-creation";
import {
  applyRoleEnter,
  applyRoleExit,
  assertNotLastAdminDemotion,
} from "./users-admin-role-lifecycle";
import { updateUserImpl } from "./users-admin-update";

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;
const MAX_RESENDS_PER_DAY = 3;

const dedupe = <T>(xs: T[]): T[] => Array.from(new Set(xs));

export const iamUserAdminApi = {
  getAll: async (): Promise<AdminUserListItem[]> => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: DEFAULT_LIST_LIMIT,
    });

    return users.map(mapToAdminUserListItem);
  },

  getPageData: async (): Promise<GetUsersPageDataResponse> => {
    const users = await iamUserAdminApi.getAll();

    return { users };
  },

  createUser: async (actorId: string, data: CreateUserData): Promise<User> => {
    resolveInviteEmailConfig();

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

        const created = await iamUserCreationApi.createPendingUser(tx, {
          email: data.email,
          name: data.name,
          role: data.role,
          timezone: data.timezone,
        });

        if (data.role === UserRole.ATHLETE && coachIds.length > 0) {
          await syncAthleteAssignments(tx, created.id, coachIds);
        }

        return created;
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }

    await iamUserCreationApi.issueInviteAndSendEmail(actorId, {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return user;
  },

  updateUser: async (actorId: string, id: string, data: UpdateUserData): Promise<User> => {
    await requireAdminStrict(actorId);

    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    return updateUserImpl(existing, actorId, id, data);
  },

  updateRole: async (actorId: string, id: string, data: UpdateUserRoleData): Promise<User> => {
    await requireAdminStrict(actorId);

    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    const currentRole = ROLE_MAP[existing.role];
    const newRole = data.role;
    const roleChanged = currentRole !== newRole;
    const isDemotionFromAdmin = currentRole === UserRole.ADMIN && newRole !== UserRole.ADMIN;

    if (isDemotionFromAdmin && actorId === id) {
      throw new ForbiddenError("Cannot demote yourself from admin");
    }

    if (newRole === UserRole.HEAD_COACH) {
      const existingHC = await prisma.user.findFirst({
        where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
      });

      if (existingHC && existingHC.id !== id) {
        throw new ConflictError("A HEAD_COACH already exists", { existingId: existingHC.id });
      }
    }

    try {
      return await prisma.$transaction(async (tx) => {
        if (isDemotionFromAdmin) {
          await assertNotLastAdminDemotion(tx);
        }

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
    await requireAdminStrict(actorId);

    const existing = await findOrThrow(prisma.user.findUnique({ where: { id } }), "User");

    if (actorId === id) {
      throw new ForbiddenError("Cannot delete yourself");
    }

    const deletedAt = new Date();
    const suffixedEmail = `${existing.email}_deleted_${deletedAt.getTime()}`;
    const isAdmin = ROLE_MAP[existing.role] === UserRole.ADMIN;

    try {
      await prisma.$transaction(async (tx) => {
        if (isAdmin) {
          await assertNotLastAdminDemotion(tx);
        }

        await applyRoleExit(tx, id, ROLE_MAP[existing.role]);
        await tx.user.update({
          where: { id },
          data: {
            deletedAt,
            email: suffixedEmail,
            tokenVersion: { increment: 1 },
          },
        });
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "User" });
    }
  },

  resendInvite: async (actorId: string, userId: string): Promise<{ expiresAt: Date }> => {
    const user = await findOrThrow(prisma.user.findUnique({ where: { id: userId } }), "User");

    if (user.password !== null) {
      throw new ConflictError("User has already set a password — invite cannot be resent");
    }

    resolveInviteEmailConfig();

    const { plainToken, expiresAt } = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`resend:${userId}`}))`;

      const since = new Date(Date.now() - HOURS_PER_DAY * MS_PER_HOUR);
      const recentTokenCount = await tx.userInviteToken.count({
        where: { userId, createdAt: { gte: since } },
      });

      if (recentTokenCount >= MAX_RESENDS_PER_DAY) {
        throw new TooManyRequestsError("Too many resends in 24 hours");
      }

      return iamInviteTokenApi.issueInTx(tx, { userId, createdByAdminId: actorId });
    });

    const expiresInHours = Math.max(
      1,
      Math.round((expiresAt.getTime() - Date.now()) / MS_PER_HOUR),
    );

    await sendInvitationEmail({
      userId: user.id,
      recipientEmail: user.email,
      recipientName: user.name,
      plainToken,
      expiresInHours,
    });

    return { expiresAt };
  },
};
