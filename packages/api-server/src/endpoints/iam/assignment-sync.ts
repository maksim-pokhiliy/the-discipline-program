import {
  ActionItemResolveReason as PrismaActionItemResolveReason,
  ActionItemStatus as PrismaActionItemStatus,
} from "@prisma/client";

import { NotFoundError } from "@repo/errors";

import { type TxClient } from "../../db/tx";

export const assertCoachesExist = async (tx: TxClient, ids: string[]): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  const existing = await tx.coachProfile.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true },
  });

  if (existing.length === ids.length) {
    return;
  }

  const foundSet = new Set(existing.map((c) => c.id));
  const missing = ids.filter((id) => !foundSet.has(id));

  throw new NotFoundError("Coach not found", { missing });
};

export const syncAthleteAssignments = async (
  tx: TxClient,
  athleteId: string,
  desiredCoachIds: string[],
): Promise<void> => {
  const toRemove = await tx.coachAthleteAssignment.findMany({
    where: { athleteId, coachId: { notIn: desiredCoachIds } },
    select: { coachId: true },
  });

  await tx.coachAthleteAssignment.deleteMany({
    where: { athleteId, coachId: { notIn: desiredCoachIds } },
  });

  if (toRemove.length > 0) {
    await tx.coachActionItem.updateMany({
      where: {
        athleteId,
        coachId: { in: toRemove.map((r) => r.coachId) },
        status: PrismaActionItemStatus.OPEN,
      },
      data: {
        status: PrismaActionItemStatus.RESOLVED,
        resolvedAt: new Date(),
        resolveReason: PrismaActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
      },
    });
  }

  if (desiredCoachIds.length > 0) {
    await tx.coachAthleteAssignment.createMany({
      data: desiredCoachIds.map((coachId) => ({ coachId, athleteId })),
      skipDuplicates: true,
    });
  }
};

export const closeAthleteActionItemsBulk = async (
  tx: TxClient,
  athleteId: string,
): Promise<void> => {
  await tx.coachActionItem.updateMany({
    where: { athleteId, status: PrismaActionItemStatus.OPEN },
    data: {
      status: PrismaActionItemStatus.RESOLVED,
      resolvedAt: new Date(),
      resolveReason: PrismaActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
    },
  });
};

export const closeCoachActionItemsBulk = async (
  tx: TxClient,
  coachUserId: string,
): Promise<void> => {
  const profile = await tx.coachProfile.findFirst({
    where: { userId: coachUserId, deletedAt: null },
    select: { id: true },
  });

  if (!profile) {
    return;
  }

  await tx.coachActionItem.updateMany({
    where: { coachId: profile.id, status: PrismaActionItemStatus.OPEN },
    data: {
      status: PrismaActionItemStatus.RESOLVED,
      resolvedAt: new Date(),
      resolveReason: PrismaActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
    },
  });
};
