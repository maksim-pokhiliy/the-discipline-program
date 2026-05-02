import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError } from "@repo/errors";

import { type TxClient } from "../../db/tx";
import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";

import {
  closeAthleteActionItemsBulk,
  closeCoachActionItemsBulk,
  syncAthleteAssignments,
} from "./assignment-sync";

const dedupe = <T>(xs: T[]): T[] => Array.from(new Set(xs));

export const applyRoleExit = async (
  tx: TxClient,
  userId: string,
  role: UserRole,
): Promise<void> => {
  switch (role) {
    case UserRole.ATHLETE: {
      await closeAthleteActionItemsBulk(tx, userId);
      await tx.coachAthleteAssignment.deleteMany({ where: { athleteId: userId } });

      return;
    }
    case UserRole.COACH:
    case UserRole.HEAD_COACH: {
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

export const applyRoleEnter = async (
  tx: TxClient,
  userId: string,
  role: UserRole,
  coachIds: string[] | undefined,
): Promise<void> => {
  switch (role) {
    case UserRole.ATHLETE: {
      await tx.athleteProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      if (coachIds !== undefined) {
        await syncAthleteAssignments(tx, userId, dedupe(coachIds));
      }

      return;
    }
    case UserRole.COACH:
    case UserRole.HEAD_COACH: {
      await tx.coachProfile.upsert({
        where: { userId },
        create: { userId },
        update: { deletedAt: null },
      });

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

export const assertNotLastAdminDemotion = async (tx: TxClient): Promise<void> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin-role-mutation'))`;

  const adminCount = await tx.user.count({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] },
  });

  if (adminCount <= 1) {
    throw new ConflictError("Cannot remove the last admin");
  }
};
