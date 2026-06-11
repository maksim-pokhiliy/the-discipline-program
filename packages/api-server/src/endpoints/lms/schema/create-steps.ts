import { ForbiddenError, NotFoundError } from "@repo/errors";

import { type TxClient } from "../_shared";

export type CreateScope = { blockId: string };

type StorageScope = { blockId: string };

export const assertPlanWritable = async (tx: TxClient, planId: string): Promise<void> => {
  const planCheck = await tx.trainingPlan.findUnique({
    where: { id: planId },
    select: { deletedAt: true, status: true },
  });

  if (!planCheck || planCheck.deletedAt !== null) {
    throw new NotFoundError("Training plan not found", { planId });
  }

  if (planCheck.status === "ARCHIVED") {
    throw new ForbiddenError("Plan is archived; edits not allowed");
  }
};

export const resolveStorageScope = async (
  tx: TxClient,
  planId: string,
  scope: CreateScope,
): Promise<StorageScope> => {
  const blockCheck = await tx.block.findUnique({
    where: { id: scope.blockId },
    select: {
      id: true,
      session: { select: { day: { select: { week: { select: { planId: true } } } } } },
    },
  });

  if (!blockCheck || blockCheck.session.day.week.planId !== planId) {
    throw new NotFoundError("Block not found", { blockId: scope.blockId, planId });
  }

  return { blockId: scope.blockId };
};

export const nextOrderInScope = async (tx: TxClient, storage: StorageScope): Promise<number> => {
  const max = await tx.schema.aggregate({
    where: { blockId: storage.blockId },
    _max: { order: true },
  });

  return (max._max.order ?? 0) + 10;
};
