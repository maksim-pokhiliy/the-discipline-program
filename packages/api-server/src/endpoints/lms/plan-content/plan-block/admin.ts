import { Prisma } from "@prisma/client";

import { type SchemeParams } from "@repo/contracts/lms/_domain";
import {
  type CreatePlanBlockRequest,
  type PlanBlock,
  type UpdatePlanBlockRequest,
} from "@repo/contracts/lms/plan-block";
import { BadRequestError, NotFoundError, ValidationError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../../authz/guards";
import { prisma } from "../../../../db/client";
import {
  mapToPlanBlock,
  parseSchemeParamsOrThrow,
  type PlanBlockWithRefsRow,
  SCHEME_ARCHETYPE_KIND_MAP,
} from "../../../../mappers/lms";
import { handlePrismaError, toInputJson } from "../../../../utils";

const blockInclude = {
  blockTypeRefs: { orderBy: { order: "asc" } },
} as const;

const parentChainInclude = {
  session: { include: { day: { select: { planId: true } } } },
  blockTypeRefs: { orderBy: { order: "asc" } },
} as const;

const validateSchemeTypeAndKind = async (
  schemeTypeId: string,
  schemeParams: SchemeParams,
): Promise<void> => {
  const schemeType = await prisma.schemeType.findUnique({
    where: { id: schemeTypeId },
    select: { archetypeKind: true, deletedAt: true },
  });

  if (!schemeType || schemeType.deletedAt !== null) {
    throw new BadRequestError("Referenced SchemeType does not exist", { schemeTypeId });
  }

  if (SCHEME_ARCHETYPE_KIND_MAP[schemeType.archetypeKind] !== schemeParams.kind) {
    throw new ValidationError("schemeParams.kind must match SchemeType.archetypeKind", {
      field: "schemeParams",
    });
  }
};

const validateBlockTypeIds = async (ids: string[]): Promise<void> => {
  const found = await prisma.blockType.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  if (found.length !== ids.length) {
    const foundIds = new Set(found.map((b) => b.id));

    throw new BadRequestError("One or more referenced BlockType ids do not exist", {
      missingIds: ids.filter((id) => !foundIds.has(id)),
    });
  }
};

const findBlockOrThrow = async (planId: string, blockId: string): Promise<PlanBlockWithRefsRow> => {
  const block = await prisma.planBlock.findUnique({
    where: { id: blockId },
    include: parentChainInclude,
  });

  if (!block || block.session.day.planId !== planId) {
    throw new NotFoundError("PlanBlock not found", { planId, blockId });
  }

  return block;
};

const verifySessionInPlan = async (planId: string, sessionId: string): Promise<void> => {
  const session = await prisma.planSession.findUnique({
    where: { id: sessionId },
    select: { day: { select: { planId: true } } },
  });

  if (!session || session.day.planId !== planId) {
    throw new NotFoundError("PlanSession not found", { planId, sessionId });
  }
};

export const lmsPlanBlockApi = {
  listBySession: async (
    userId: string,
    planId: string,
    sessionId: string,
  ): Promise<PlanBlock[]> => {
    await verifyPlanOwnership(planId, userId);
    await verifySessionInPlan(planId, sessionId);

    const blocks = await prisma.planBlock.findMany({
      where: { sessionId },
      orderBy: { order: "asc" },
      include: blockInclude,
    });

    return blocks.map(mapToPlanBlock);
  },

  getById: async (userId: string, planId: string, blockId: string): Promise<PlanBlock> => {
    await verifyPlanOwnership(planId, userId);
    const block = await findBlockOrThrow(planId, blockId);

    return mapToPlanBlock(block);
  },

  create: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: CreatePlanBlockRequest,
  ): Promise<PlanBlock> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);
    await verifySessionInPlan(planId, sessionId);
    await validateSchemeTypeAndKind(data.schemeTypeId, data.schemeParams);
    await validateBlockTypeIds(data.blockTypeIds);

    try {
      const block = await prisma.planBlock.create({
        data: {
          sessionId,
          order: data.order,
          schemeTypeId: data.schemeTypeId,
          schemeParams: toInputJson(data.schemeParams),
          ...(data.modifiers !== undefined && { modifiers: toInputJson(data.modifiers) }),
          ...(data.notes !== undefined && { notes: data.notes }),
          blockTypeRefs: {
            create: data.blockTypeIds.map((blockTypeId, order) => ({ blockTypeId, order })),
          },
        },
        include: blockInclude,
      });

      return mapToPlanBlock(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanBlock" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    blockId: string,
    data: UpdatePlanBlockRequest,
  ): Promise<PlanBlock> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const existing = await findBlockOrThrow(planId, blockId);

    if (data.schemeTypeId !== undefined || data.schemeParams !== undefined) {
      const effectiveSchemeTypeId = data.schemeTypeId ?? existing.schemeTypeId;
      const effectiveSchemeParams =
        data.schemeParams ?? parseSchemeParamsOrThrow(existing.schemeParams, existing.id);

      await validateSchemeTypeAndKind(effectiveSchemeTypeId, effectiveSchemeParams);
    }

    if (data.blockTypeIds !== undefined) {
      await validateBlockTypeIds(data.blockTypeIds);
    }

    return applyBlockUpdate(blockId, data);
  },

  delete: async (userId: string, planId: string, blockId: string): Promise<void> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);
    await findBlockOrThrow(planId, blockId);

    try {
      await prisma.planBlock.delete({ where: { id: blockId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanBlock" });
    }
  },
};

const buildScalarUpdate = (data: UpdatePlanBlockRequest): Prisma.PlanBlockUpdateInput => ({
  ...(data.order !== undefined && { order: data.order }),
  ...(data.schemeTypeId !== undefined && {
    schemeType: { connect: { id: data.schemeTypeId } },
  }),
  ...(data.schemeParams !== undefined && { schemeParams: toInputJson(data.schemeParams) }),
  ...(data.modifiers !== undefined && {
    modifiers: data.modifiers === null ? Prisma.DbNull : toInputJson(data.modifiers),
  }),
  ...(data.notes !== undefined && { notes: data.notes }),
});

const applyBlockUpdate = async (
  blockId: string,
  data: UpdatePlanBlockRequest,
): Promise<PlanBlock> => {
  try {
    const block = await prisma.$transaction(async (tx) => {
      if (data.blockTypeIds !== undefined) {
        const ids = data.blockTypeIds;

        await tx.planBlockTypeRef.deleteMany({ where: { blockId } });
        await tx.planBlockTypeRef.createMany({
          data: ids.map((blockTypeId, order) => ({ blockId, blockTypeId, order })),
        });
      }

      const scalarUpdate = buildScalarUpdate(data);
      const hasScalarChanges = Object.keys(scalarUpdate).length > 0;
      const updateData = hasScalarChanges ? scalarUpdate : { updatedAt: new Date() };

      return tx.planBlock.update({
        where: { id: blockId },
        data: updateData,
        include: blockInclude,
      });
    });

    return mapToPlanBlock(block);
  } catch (error) {
    return handlePrismaError(error, { entity: "PlanBlock" });
  }
};
