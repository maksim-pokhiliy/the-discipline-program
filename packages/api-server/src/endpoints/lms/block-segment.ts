import { Prisma } from "@prisma/client";

import {
  type CreateBlockSegmentInput,
  type UpdateBlockSegmentInput,
} from "@repo/contracts/lms/block-segment";

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
      const segment = await prisma.blockSegment.update({
        where: { id: segmentId },
        data: {
          ...(data.order !== undefined ? { order: data.order } : {}),
          ...(data.label !== undefined ? { label: data.label } : {}),
          ...(data.archetypeKind
            ? { archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind] }
            : {}),
          ...(data.schemeParams !== undefined
            ? { schemeParams: toJsonInput(data.schemeParams) }
            : {}),
          ...(data.schemeTemplateId !== undefined
            ? { schemeTemplateId: data.schemeTemplateId }
            : {}),
          ...(data.restConfig !== undefined
            ? {
                restConfig:
                  data.restConfig === null ? Prisma.JsonNull : toJsonInput(data.restConfig),
              }
            : {}),
        },
      });

      return mapToBlockSegment(segment);
    } catch (error) {
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
