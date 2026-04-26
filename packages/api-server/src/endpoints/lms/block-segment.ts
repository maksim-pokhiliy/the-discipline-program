import { Prisma } from "@prisma/client";

import {
  type CreateBlockSegmentInput,
  type UpdateBlockSegmentInput,
} from "@repo/contracts/lms/block-segment";
import { ConflictError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToBlockSegment, SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { resolvePlanIdForBlock, resolvePlanIdForBlockSegment } from "./plan-tree-helpers";

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export const lmsBlockSegmentApi = {
  getById: async (userId: string, segmentId: string) => {
    const planId = await resolvePlanIdForBlockSegment(segmentId);

    await verifyPlanOwnership(planId, userId);

    const segment = await findOrThrow(
      prisma.blockSegment.findUnique({ where: { id: segmentId } }),
      "Block segment",
    );

    return mapToBlockSegment(segment);
  },

  create: async (userId: string, data: CreateBlockSegmentInput) => {
    const planId = await resolvePlanIdForBlock(data.blockId);

    await verifyPlanOwnership(planId, userId);

    try {
      const segment = await prisma.blockSegment.create({
        data: {
          blockId: data.blockId,
          order: data.order,
          label: data.label ?? null,
          archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind],
          schemeParams: toJsonInput(data.schemeParams),
          schemeTemplateId: data.schemeTemplateId ?? null,
          restConfig:
            data.restConfig === undefined ? Prisma.JsonNull : toJsonInput(data.restConfig),
        },
      });

      return mapToBlockSegment(segment);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block segment" });
    }
  },

  update: async (userId: string, segmentId: string, data: UpdateBlockSegmentInput) => {
    const planId = await resolvePlanIdForBlockSegment(segmentId);

    await verifyPlanOwnership(planId, userId);

    try {
      const result = await prisma.blockSegment.updateMany({
        where: { id: segmentId, version: data.expectedVersion },
        data: {
          order: data.order,
          label: data.label,
          archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind],
          schemeParams: toJsonInput(data.schemeParams),
          schemeTemplateId: data.schemeTemplateId,
          restConfig: data.restConfig === null ? Prisma.JsonNull : toJsonInput(data.restConfig),
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        const current = await prisma.blockSegment.findUnique({
          where: { id: segmentId },
          select: { version: true },
        });

        if (!current) {
          throw new NotFoundError("Block segment not found", { segmentId });
        }

        throw new ConflictError("Block segment version conflict", {
          segmentId,
          currentVersion: current.version,
          expectedVersion: data.expectedVersion,
        });
      }

      const segment = await findOrThrow(
        prisma.blockSegment.findUnique({ where: { id: segmentId } }),
        "Block segment",
      );

      return mapToBlockSegment(segment);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }

      return handlePrismaError(error, { entity: "Block segment" });
    }
  },

  delete: async (userId: string, segmentId: string): Promise<void> => {
    const planId = await resolvePlanIdForBlockSegment(segmentId);

    await verifyPlanOwnership(planId, userId);

    try {
      await prisma.blockSegment.delete({ where: { id: segmentId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block segment" });
    }
  },
};
