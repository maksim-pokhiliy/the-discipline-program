import {
  ActionItemResolveReason as PrismaActionItemResolveReason,
  ActionItemStatus as PrismaActionItemStatus,
} from "@prisma/client";

import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../db/client";

export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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

const closeOrphanActionItems = async (
  tx: TxClient,
  coachId: string,
  athleteId: string,
): Promise<void> => {
  await tx.coachActionItem.updateMany({
    where: { coachId, athleteId, status: PrismaActionItemStatus.OPEN },
    data: {
      status: PrismaActionItemStatus.RESOLVED,
      resolvedAt: new Date(),
      resolveReason: PrismaActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
    },
  });
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

  for (const { coachId } of toRemove) {
    await closeOrphanActionItems(tx, coachId, athleteId);
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
  await tx.coachActionItem.updateMany({
    where: { coach: { userId: coachUserId }, status: PrismaActionItemStatus.OPEN },
    data: {
      status: PrismaActionItemStatus.RESOLVED,
      resolvedAt: new Date(),
      resolveReason: PrismaActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
    },
  });
};
