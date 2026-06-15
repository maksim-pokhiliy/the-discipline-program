import { Prisma } from "@prisma/client";

import {
  type AssignBlockLabelsData,
  type Block,
  type CreateBlockData,
  type ReorderBlocksData,
  type UpdateBlockData,
} from "@repo/contracts/lms/block";
import { type AppLevelValue } from "@repo/contracts/lms/label";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyPlanEditable,
  verifySessionOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToBlock, mapToBlockWithLabels } from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import { BLOCK_SUBTREE_INCLUDE, deepCloneBlock, type TxClient } from "../_shared";
import { assertPlanWritable } from "../schema/create-steps";

const BLOCK_WITH_LABELS_INCLUDE = {
  labelAssignments: {
    include: { label: true },
    orderBy: { order: "asc" as const },
  },
} satisfies Prisma.BlockInclude;

const assertLabelsApplicable = async (tx: TxClient, labelIds: readonly string[]): Promise<void> => {
  if (labelIds.length === 0) {
    return;
  }

  const labels = await tx.label.findMany({
    where: { id: { in: [...labelIds] } },
    select: { id: true, applicableLevels: true },
  });

  if (labels.length !== labelIds.length) {
    const missing = labelIds.filter((id) => !labels.some((l) => l.id === id));

    throw new NotFoundError("Label not found", { missing });
  }

  for (const label of labels) {
    const levels = label.applicableLevels as AppLevelValue[];

    if (!levels.includes("BLOCK")) {
      throw new BadRequestError("Label is not applicable to BLOCK level", {
        labelId: label.id,
        applicableLevels: levels,
      });
    }
  }
};

export const lmsBlockApi = {
  create: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: CreateBlockData,
  ): Promise<Block> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Session not found", { sessionId, planId });
    }

    verifyPlanEditable(owner);

    const labelIds = data.labelIds ?? [];

    try {
      const block = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
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

            const sessionCheck = await tx.session.findUnique({
              where: { id: sessionId },
              select: { id: true, day: { select: { week: { select: { planId: true } } } } },
            });

            if (!sessionCheck || sessionCheck.day.week.planId !== planId) {
              throw new NotFoundError("Session not found", { sessionId, planId });
            }

            await assertLabelsApplicable(tx, labelIds);

            const max = await tx.block.aggregate({
              where: { sessionId },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            const created = await tx.block.create({
              data: {
                sessionId,
                order: nextOrder,
                notes: marshalNullableJson(data.notes),
              },
            });

            if (labelIds.length > 0) {
              await tx.blockLabelAssignment.createMany({
                data: labelIds.map((labelId, i) => ({
                  blockId: created.id,
                  labelId,
                  order: (i + 1) * 10,
                })),
              });
            }

            return tx.block.findUniqueOrThrow({
              where: { id: created.id },
              include: BLOCK_WITH_LABELS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToBlockWithLabels(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  duplicate: async (userId: string, planId: string, blockId: string): Promise<Block> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Block not found", { blockId, planId });
    }

    verifyPlanEditable(owner);

    try {
      const block = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanWritable(tx, planId);

            const source = await tx.block.findUniqueOrThrow({
              where: { id: blockId },
              include: BLOCK_SUBTREE_INCLUDE,
            });

            const max = await tx.block.aggregate({
              where: { sessionId: owner.sessionId },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            const createdId = await deepCloneBlock(tx, source, owner.sessionId, nextOrder);

            return tx.block.findUniqueOrThrow({
              where: { id: createdId },
              include: BLOCK_WITH_LABELS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToBlockWithLabels(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  update: async (userId: string, blockId: string, data: UpdateBlockData): Promise<Block> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      const updated = await prisma.block.update({
        where: { id: blockId },
        data: {
          ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
        },
        include: BLOCK_WITH_LABELS_INCLUDE,
      });

      return mapToBlockWithLabels(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  delete: async (userId: string, blockId: string): Promise<void> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.block.delete({ where: { id: blockId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: ReorderBlocksData,
  ): Promise<Block[]> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Session not found", { sessionId, planId });
    }

    verifyPlanEditable(owner);

    const blocks = await prisma.block.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, sessionId: true },
    });

    if (blocks.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent blocks", {
        missing: data.orderedIds.filter((id) => !blocks.some((b) => b.id === id)),
      });
    }

    const foreignSessionIds = blocks.filter((b) => b.sessionId !== sessionId);

    if (foreignSessionIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target session", {
        foreignIds: foreignSessionIds.map((b) => b.id),
      });
    }

    const sessionCount = await prisma.block.count({ where: { sessionId } });

    if (data.orderedIds.length !== sessionCount) {
      throw new BadRequestError("orderedIds must include every block in the target session", {
        provided: data.orderedIds.length,
        expected: sessionCount,
      });
    }

    try {
      const updated = await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.block.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.block.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      return updated.slice(data.orderedIds.length).map(mapToBlock);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  assignLabels: async (
    userId: string,
    blockId: string,
    data: AssignBlockLabelsData,
  ): Promise<Block> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      const block = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertLabelsApplicable(tx, data.labelIds);

            await tx.blockLabelAssignment.deleteMany({ where: { blockId } });

            if (data.labelIds.length > 0) {
              await tx.blockLabelAssignment.createMany({
                data: data.labelIds.map((labelId, i) => ({
                  blockId,
                  labelId,
                  order: (i + 1) * 10,
                })),
              });
            }

            return tx.block.findUniqueOrThrow({
              where: { id: blockId },
              include: BLOCK_WITH_LABELS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToBlockWithLabels(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },
};
