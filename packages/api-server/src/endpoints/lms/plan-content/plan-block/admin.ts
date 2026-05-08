import { Prisma } from "@prisma/client";

import { defaultSchemeParams } from "@repo/contracts/lms/_domain";
import {
  type CreatePlanBlockRequest,
  type CreatePlanBlockResponse,
  type UpdatePlanBlockRequest,
  type UpdatePlanBlockResponse,
  type PlanBlock,
} from "@repo/contracts/lms/plan-block";
import { NotFoundError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../../authz/guards";
import { prisma } from "../../../../db/client";
import {
  mapToPlanBlock,
  mapToPlanItem,
  parseSchemeParamsOrThrow,
  type PlanBlockWithRefsRow,
} from "../../../../mappers/lms";
import { handlePrismaError, toInputJson } from "../../../../utils";

import {
  applyItemDiff,
  loadActiveArchetypeKindOrThrow,
  toCreatePlanItemInput,
  validateBlockTypeIds,
  validatePlanItemsBatch,
  validateSchemeTypeAndKind,
} from "./plan-item-batch";

const blockInclude = {
  blockTypeRefs: { orderBy: { order: "asc" } },
} as const;

const blockWithItemsInclude = {
  blockTypeRefs: { orderBy: { order: "asc" } },
  items: { orderBy: { order: "asc" } },
} as const;

const parentChainInclude = {
  session: { include: { day: { select: { planId: true } } } },
  blockTypeRefs: { orderBy: { order: "asc" } },
} as const;

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type PlanBlockWithItemsRow = PlanBlockWithRefsRow & {
  items: Array<Parameters<typeof mapToPlanItem>[0]>;
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

const findBlockWithItemsOrThrow = (tx: PrismaTx, blockId: string): Promise<PlanBlockWithItemsRow> =>
  tx.planBlock.findUniqueOrThrow({
    where: { id: blockId },
    include: blockWithItemsInclude,
  });

const mapBlockWithItems = (block: PlanBlockWithItemsRow): CreatePlanBlockResponse => {
  const baseBlock: PlanBlock = mapToPlanBlock(block);

  return { ...baseBlock, items: block.items.map(mapToPlanItem) };
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
  ): Promise<CreatePlanBlockResponse> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);
    await verifySessionInPlan(planId, sessionId);

    const archetypeKind = await loadActiveArchetypeKindOrThrow(data.schemeTypeId);
    const schemeParams = defaultSchemeParams(archetypeKind);

    await validateBlockTypeIds(data.blockTypeIds);

    const items = data.items ?? [];

    if (items.length > 0) {
      await validatePlanItemsBatch(items);
    }

    try {
      const block = await prisma.$transaction(async (tx) => {
        const created = await tx.planBlock.create({
          data: {
            sessionId,
            order: data.order,
            schemeTypeId: data.schemeTypeId,
            schemeParams: toInputJson(schemeParams),
            ...(data.modifiers !== undefined && { modifiers: toInputJson(data.modifiers) }),
            ...(data.notes !== undefined && { notes: data.notes }),
            blockTypeRefs: {
              create: data.blockTypeIds.map((blockTypeId, order) => ({ blockTypeId, order })),
            },
          },
          select: { id: true },
        });

        if (items.length > 0) {
          await tx.planItem.createMany({
            data: items.map((i) => toCreatePlanItemInput(created.id, i)),
          });
        }

        return findBlockWithItemsOrThrow(tx, created.id);
      });

      return mapBlockWithItems(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanBlock" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    blockId: string,
    data: UpdatePlanBlockRequest,
  ): Promise<UpdatePlanBlockResponse> => {
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

    if (data.items !== undefined && data.items.length > 0) {
      await validatePlanItemsBatch(data.items);
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
): Promise<UpdatePlanBlockResponse> => {
  try {
    const block = await prisma.$transaction(async (tx) => {
      if (data.blockTypeIds !== undefined) {
        const ids = data.blockTypeIds;

        await tx.planBlockTypeRef.deleteMany({ where: { blockId } });
        await tx.planBlockTypeRef.createMany({
          data: ids.map((blockTypeId, order) => ({ blockId, blockTypeId, order })),
        });
      }

      if (data.items !== undefined) {
        await applyItemDiff(tx, blockId, data.items);
      }

      const scalarUpdate = buildScalarUpdate(data);
      const hasScalarChanges = Object.keys(scalarUpdate).length > 0;
      const updateData = hasScalarChanges ? scalarUpdate : { updatedAt: new Date() };

      await tx.planBlock.update({
        where: { id: blockId },
        data: updateData,
      });

      return findBlockWithItemsOrThrow(tx, blockId);
    });

    return mapBlockWithItems(block);
  } catch (error) {
    return handlePrismaError(error, { entity: "PlanBlock" });
  }
};
