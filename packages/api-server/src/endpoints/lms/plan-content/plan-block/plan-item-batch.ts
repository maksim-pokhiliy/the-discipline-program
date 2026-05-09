import { Prisma } from "@prisma/client";

import { type SchemeArchetypeKind, type SchemeParams } from "@repo/contracts/lms/_domain";
import {
  ALTERNATIVES_NO_PRIMARY_MESSAGE,
  ALTERNATIVES_UNIQUE_MESSAGE,
  altsExcludePrimary,
  hasUniqueAlternativeIds,
  type PlanItemForUpsert,
} from "@repo/contracts/lms/plan-item";
import { BadRequestError, ValidationError } from "@repo/errors";

import { prisma } from "../../../../db/client";
import { SCHEME_ARCHETYPE_KIND_MAP } from "../../../../mappers/lms";
import { toInputJson } from "../../../../utils";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type PlanItemForUpdate = PlanItemForUpsert & { id: string };

export const loadActiveArchetypeKindOrThrow = async (
  schemeTypeId: string,
): Promise<SchemeArchetypeKind> => {
  const schemeType = await prisma.schemeType.findUnique({
    where: { id: schemeTypeId },
    select: { archetypeKind: true, deletedAt: true },
  });

  if (!schemeType || schemeType.deletedAt !== null) {
    throw new BadRequestError("Referenced SchemeType does not exist", { schemeTypeId });
  }

  return SCHEME_ARCHETYPE_KIND_MAP[schemeType.archetypeKind];
};

export const validateSchemeTypeAndKind = async (
  schemeTypeId: string,
  schemeParams: SchemeParams,
): Promise<void> => {
  const archetypeKind = await loadActiveArchetypeKindOrThrow(schemeTypeId);

  if (archetypeKind !== schemeParams.kind) {
    throw new ValidationError("schemeParams.kind must match SchemeType.archetypeKind", {
      field: "schemeParams",
    });
  }
};

export const validateBlockTypeIds = async (ids: readonly string[]): Promise<void> => {
  const found = await prisma.blockType.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true },
  });

  if (found.length !== ids.length) {
    const foundIds = new Set(found.map((b) => b.id));

    throw new BadRequestError("One or more referenced BlockType ids do not exist", {
      missingIds: ids.filter((id) => !foundIds.has(id)),
    });
  }
};

const collectExerciseIds = (items: readonly PlanItemForUpsert[]): string[] => {
  const ids: string[] = [];

  for (const item of items) {
    ids.push(item.exerciseId);

    if (item.alternatives) {
      for (const alt of item.alternatives) {
        ids.push(alt.exerciseId);
      }
    }
  }

  return ids;
};

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

const validateUniqueIncomingIds = (items: readonly PlanItemForUpsert[]): void => {
  const ids = items.map((i) => i.id).filter((id): id is string => id !== undefined);

  if (new Set(ids).size !== ids.length) {
    throw new ValidationError("items contains duplicate ids", { field: "items" });
  }
};

export const validatePlanItemsBatch = async (
  items: readonly PlanItemForUpsert[],
): Promise<void> => {
  validateUniqueIncomingIds(items);

  for (const item of items) {
    if (!hasUniqueAlternativeIds(item.alternatives)) {
      throw new ValidationError(ALTERNATIVES_UNIQUE_MESSAGE, { field: "alternatives" });
    }

    if (!altsExcludePrimary(item.alternatives, item.exerciseId)) {
      throw new ValidationError(ALTERNATIVES_NO_PRIMARY_MESSAGE, { field: "alternatives" });
    }
  }

  await validateExerciseIds(collectExerciseIds(items));
};

export const toCreatePlanItemInput = (
  blockId: string,
  item: PlanItemForUpsert,
): Prisma.PlanItemCreateManyInput => ({
  blockId,
  order: item.order,
  exerciseId: item.exerciseId,
  prescription: toInputJson(item.prescription),
  ...(item.alternatives !== undefined && { alternatives: toInputJson(item.alternatives) }),
  ...(item.notes !== undefined && { notes: item.notes }),
});

const buildPlanItemUpdate = (item: PlanItemForUpdate): Prisma.PlanItemUpdateInput => ({
  order: item.order,
  exercise: { connect: { id: item.exerciseId } },
  prescription: toInputJson(item.prescription),
  alternatives: item.alternatives === undefined ? Prisma.DbNull : toInputJson(item.alternatives),
  notes: item.notes ?? null,
});

export const applyItemDiff = async (
  tx: PrismaTx,
  blockId: string,
  items: readonly PlanItemForUpsert[],
): Promise<void> => {
  const existing = await tx.planItem.findMany({
    where: { blockId },
    select: { id: true },
  });
  const existingItemIdSet = new Set(existing.map((i) => i.id));
  const itemsToUpdate = items.filter((i): i is PlanItemForUpdate => i.id !== undefined);
  const itemsToCreate = items.filter((i) => i.id === undefined);

  for (const upd of itemsToUpdate) {
    if (!existingItemIdSet.has(upd.id)) {
      throw new BadRequestError("Item id does not belong to this block", {
        itemId: upd.id,
        blockId,
      });
    }
  }

  const incomingIdSet = new Set(itemsToUpdate.map((i) => i.id));
  const idsToDelete = [...existingItemIdSet].filter((id) => !incomingIdSet.has(id));

  if (idsToDelete.length > 0) {
    await tx.planItem.deleteMany({ where: { id: { in: idsToDelete }, blockId } });
  }

  for (const item of itemsToUpdate) {
    await tx.planItem.update({
      where: { id: item.id, blockId },
      data: buildPlanItemUpdate(item),
    });
  }

  if (itemsToCreate.length > 0) {
    await tx.planItem.createMany({
      data: itemsToCreate.map((i) => toCreatePlanItemInput(blockId, i)),
    });
  }
};
