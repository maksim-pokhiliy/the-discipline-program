import {
  type CreateBlockInput,
  type MoveBlockInput,
  type UpdateBlockInput,
} from "@repo/contracts/lms/block";
import { ConflictError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { BLOCK_STATUS_TO_PRISMA_MAP, mapToBlock } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { resolvePlanIdForBlock, resolvePlanIdForSession } from "./plan-tree-helpers";

export const lmsBlockApi = {
  getById: async (userId: string, blockId: string) => {
    const planId = await resolvePlanIdForBlock(blockId);

    await verifyPlanOwnership(planId, userId);

    const block = await findOrThrow(prisma.block.findUnique({ where: { id: blockId } }), "Block");

    return mapToBlock(block);
  },

  create: async (userId: string, data: CreateBlockInput) => {
    const planId = await resolvePlanIdForSession(data.sessionId);

    await verifyPlanOwnership(planId, userId);

    try {
      const block = await prisma.block.create({
        data: {
          sessionId: data.sessionId,
          order: data.order,
          kindId: data.kindId,
          title: data.title ?? null,
          status: BLOCK_STATUS_TO_PRISMA_MAP[data.status],
          weight: data.weight,
          notes: data.notes ?? null,
        },
      });

      return mapToBlock(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  update: async (userId: string, blockId: string, data: UpdateBlockInput) => {
    const planId = await resolvePlanIdForBlock(blockId);

    await verifyPlanOwnership(planId, userId);

    try {
      const result = await prisma.block.updateMany({
        where: { id: blockId, version: data.expectedVersion },
        data: {
          order: data.order,
          kindId: data.kindId,
          title: data.title,
          status: BLOCK_STATUS_TO_PRISMA_MAP[data.status],
          weight: data.weight,
          notes: data.notes,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        const current = await prisma.block.findUnique({
          where: { id: blockId },
          select: { version: true },
        });

        if (!current) {
          throw new NotFoundError("Block not found", { blockId });
        }

        throw new ConflictError("Block version conflict", {
          blockId,
          currentVersion: current.version,
          expectedVersion: data.expectedVersion,
        });
      }

      const block = await findOrThrow(prisma.block.findUnique({ where: { id: blockId } }), "Block");

      return mapToBlock(block);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }

      return handlePrismaError(error, { entity: "Block" });
    }
  },

  delete: async (userId: string, blockId: string): Promise<void> => {
    const planId = await resolvePlanIdForBlock(blockId);

    await verifyPlanOwnership(planId, userId);

    try {
      await prisma.block.delete({ where: { id: blockId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  move: async (userId: string, blockId: string, data: MoveBlockInput) => {
    const sourcePlanId = await resolvePlanIdForBlock(blockId);

    await verifyPlanOwnership(sourcePlanId, userId);

    const targetPlanId = await resolvePlanIdForSession(data.targetSessionId);

    await verifyPlanOwnership(targetPlanId, userId);

    try {
      const block = await prisma.block.update({
        where: { id: blockId },
        data: {
          sessionId: data.targetSessionId,
          order: data.targetOrder,
        },
      });

      return mapToBlock(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  suspend: async (userId: string, blockId: string) => {
    const planId = await resolvePlanIdForBlock(blockId);

    await verifyPlanOwnership(planId, userId);

    try {
      const block = await prisma.block.update({
        where: { id: blockId },
        data: { status: BLOCK_STATUS_TO_PRISMA_MAP.SUSPENDED },
      });

      return mapToBlock(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },
};
