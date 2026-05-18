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
import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";

const BLOCK_WITH_LABELS_INCLUDE = {
  labelAssignments: {
    include: { label: true },
    orderBy: { order: "asc" as const },
  },
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

            if (labelIds.length > 0) {
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
            }

            const max = await tx.block.aggregate({
              where: { sessionId },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            const created = await tx.block.create({
              data: {
                sessionId,
                order: nextOrder,
                intensity:
                  data.intensity === undefined || data.intensity === null
                    ? Prisma.JsonNull
                    : toInputJson(data.intensity),
                timeCap:
                  data.timeCap === undefined || data.timeCap === null
                    ? Prisma.JsonNull
                    : toInputJson(data.timeCap),
                notes: data.notes ?? null,
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

  update: async (userId: string, blockId: string, data: UpdateBlockData): Promise<Block> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      const updated = await prisma.block.update({
        where: { id: blockId },
        data: {
          ...(data.intensity !== undefined && {
            intensity: data.intensity === null ? Prisma.JsonNull : toInputJson(data.intensity),
          }),
          ...(data.timeCap !== undefined && {
            timeCap: data.timeCap === null ? Prisma.JsonNull : toInputJson(data.timeCap),
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
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
      const updated = await prisma.$transaction(
        data.orderedIds.map((id, i) =>
          prisma.block.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      );

      return updated.map(mapToBlock);
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
            if (data.labelIds.length > 0) {
              const labels = await tx.label.findMany({
                where: { id: { in: [...data.labelIds] } },
                select: { id: true, applicableLevels: true },
              });

              if (labels.length !== data.labelIds.length) {
                const missing = data.labelIds.filter((id) => !labels.some((l) => l.id === id));

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
            }

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
