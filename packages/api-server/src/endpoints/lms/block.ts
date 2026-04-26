import {
  type CreateBlockInput,
  type MoveBlockInput,
  type UpdateBlockInput,
} from "@repo/contracts/lms/block";

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
      const block = await prisma.block.update({
        where: { id: blockId },
        data: {
          ...(data.order !== undefined ? { order: data.order } : {}),
          ...(data.kindId ? { kindId: data.kindId } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.status ? { status: BLOCK_STATUS_TO_PRISMA_MAP[data.status] } : {}),
          ...(data.weight !== undefined ? { weight: data.weight } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      return mapToBlock(block);
    } catch (error) {
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
