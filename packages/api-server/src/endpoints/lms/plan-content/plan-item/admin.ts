import { Prisma } from "@prisma/client";

import {
  ALTERNATIVES_NO_PRIMARY_MESSAGE,
  ALTERNATIVES_UNIQUE_MESSAGE,
  altsExcludePrimary,
  type CreatePlanItemRequest,
  hasUniqueAlternativeIds,
  type PlanItem,
  type PlanItemAlternative,
  type UpdatePlanItemRequest,
} from "@repo/contracts/lms/plan-item";
import { BadRequestError, NotFoundError, ValidationError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../../authz/guards";
import { prisma } from "../../../../db/client";
import { mapToPlanItem } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError, toInputJson } from "../../../../utils";

const validateExerciseIds = async (exerciseIds: readonly string[]): Promise<void> => {
  if (exerciseIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(exerciseIds)];

  const exercises = await prisma.exercise.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });

  if (exercises.length !== uniqueIds.length) {
    throw new BadRequestError("Referenced Exercise does not exist", { field: "exerciseId" });
  }
};

const collectExerciseIds = (
  primary: string | undefined,
  alternatives: { exerciseId: string }[] | null | undefined,
): string[] => {
  const ids: string[] = [];

  if (primary !== undefined) {
    ids.push(primary);
  }

  if (alternatives) {
    for (const alt of alternatives) {
      ids.push(alt.exerciseId);
    }
  }

  return ids;
};

const ensureBlockBelongsToPlan = async (planId: string, blockId: string): Promise<void> => {
  const block = await findOrThrow(
    prisma.planBlock.findUnique({
      where: { id: blockId },
      select: { session: { select: { day: { select: { planId: true } } } } },
    }),
    "PlanBlock",
  );

  if (block.session.day.planId !== planId) {
    throw new NotFoundError("PlanBlock not found");
  }
};

const loadItemForPlan = async (planId: string, itemId: string) => {
  const item = await findOrThrow(
    prisma.planItem.findUnique({
      where: { id: itemId },
      include: {
        block: { include: { session: { include: { day: { select: { planId: true } } } } } },
      },
    }),
    "PlanItem",
  );

  if (item.block.session.day.planId !== planId) {
    throw new NotFoundError("PlanItem not found");
  }

  return item;
};

const buildItemUpdate = (data: UpdatePlanItemRequest): Prisma.PlanItemUpdateInput => ({
  ...(data.order !== undefined && { order: data.order }),
  ...(data.exerciseId !== undefined && {
    exercise: { connect: { id: data.exerciseId } },
  }),
  ...(data.prescription !== undefined && { prescription: toInputJson(data.prescription) }),
  ...(data.alternatives !== undefined && {
    alternatives: data.alternatives === null ? Prisma.DbNull : toInputJson(data.alternatives),
  }),
  ...(data.notes !== undefined && { notes: data.notes }),
});

const validateMergedAlternatives = (current: PlanItem, data: UpdatePlanItemRequest): void => {
  const mergedPrimary = data.exerciseId ?? current.exerciseId;
  const mergedAlternatives: PlanItemAlternative[] | null =
    data.alternatives !== undefined ? data.alternatives : current.alternatives;

  if (mergedAlternatives === null) {
    return;
  }

  if (!hasUniqueAlternativeIds(mergedAlternatives)) {
    throw new ValidationError(ALTERNATIVES_UNIQUE_MESSAGE, {
      field: "alternatives",
    });
  }

  if (!altsExcludePrimary(mergedAlternatives, mergedPrimary)) {
    throw new ValidationError(ALTERNATIVES_NO_PRIMARY_MESSAGE, {
      field: "alternatives",
    });
  }
};

export const lmsPlanItemApi = {
  listByBlock: async (userId: string, planId: string, blockId: string): Promise<PlanItem[]> => {
    await verifyPlanOwnership(planId, userId);
    await ensureBlockBelongsToPlan(planId, blockId);

    const items = await prisma.planItem.findMany({
      where: { blockId },
      orderBy: { order: "asc" },
    });

    return items.map(mapToPlanItem);
  },

  getById: async (userId: string, planId: string, itemId: string): Promise<PlanItem> => {
    await verifyPlanOwnership(planId, userId);

    const item = await loadItemForPlan(planId, itemId);

    return mapToPlanItem(item);
  },

  create: async (
    userId: string,
    planId: string,
    blockId: string,
    data: CreatePlanItemRequest,
  ): Promise<PlanItem> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    await ensureBlockBelongsToPlan(planId, blockId);

    await validateExerciseIds(collectExerciseIds(data.exerciseId, data.alternatives));

    try {
      const item = await prisma.planItem.create({
        data: {
          blockId,
          order: data.order,
          exerciseId: data.exerciseId,
          prescription: toInputJson(data.prescription),
          ...(data.alternatives !== undefined && {
            alternatives: toInputJson(data.alternatives),
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      return mapToPlanItem(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanItem" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    itemId: string,
    data: UpdatePlanItemRequest,
  ): Promise<PlanItem> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const existing = mapToPlanItem(await loadItemForPlan(planId, itemId));

    validateMergedAlternatives(existing, data);

    await validateExerciseIds(collectExerciseIds(data.exerciseId, data.alternatives));

    try {
      const item = await prisma.planItem.update({
        where: { id: itemId },
        data: buildItemUpdate(data),
      });

      return mapToPlanItem(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanItem" });
    }
  },

  delete: async (userId: string, planId: string, itemId: string): Promise<void> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    await loadItemForPlan(planId, itemId);

    try {
      await prisma.planItem.delete({ where: { id: itemId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanItem" });
    }
  },
};
