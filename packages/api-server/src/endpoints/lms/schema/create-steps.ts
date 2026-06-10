import { type Composition } from "@repo/contracts/lms/composition";
import { type CreateParallelSchemasRequest, type SchemaWithBody } from "@repo/contracts/lms/schema";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { assertComposeTreeValidForWrite, buildSchemaSubtree } from "../../../mappers/lms";
import { toInputJson } from "../../../utils";
import { type TxClient } from "../_shared";

export type CreateScope = { blockId: string } | { parentSchemaId: string };

export type ParallelSchemasBodyData = Omit<
  CreateParallelSchemasRequest,
  "blockId" | "parentSchemaId"
>;

type StorageScope = { blockId: string; parentSchemaId: string | null };

export const assertPlanWritable = async (tx: TxClient, planId: string): Promise<void> => {
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
};

export const resolveStorageScope = async (
  tx: TxClient,
  planId: string,
  scope: CreateScope,
): Promise<StorageScope> => {
  if ("blockId" in scope) {
    const blockCheck = await tx.block.findUnique({
      where: { id: scope.blockId },
      select: {
        id: true,
        session: { select: { day: { select: { week: { select: { planId: true } } } } } },
      },
    });

    if (!blockCheck || blockCheck.session.day.week.planId !== planId) {
      throw new NotFoundError("Block not found", { blockId: scope.blockId, planId });
    }

    return { blockId: scope.blockId, parentSchemaId: null };
  }

  const parent = await tx.schema.findUnique({
    where: { id: scope.parentSchemaId },
    select: {
      id: true,
      blockId: true,
      block: {
        select: {
          session: {
            select: { day: { select: { week: { select: { planId: true } } } } },
          },
        },
      },
    },
  });

  if (!parent || parent.block.session.day.week.planId !== planId) {
    throw new NotFoundError("Parent schema not found", {
      parentSchemaId: scope.parentSchemaId,
      planId,
    });
  }

  return { blockId: parent.blockId, parentSchemaId: scope.parentSchemaId };
};

export const nextOrderInScope = async (tx: TxClient, storage: StorageScope): Promise<number> => {
  const max = await tx.schema.aggregate({
    where: { blockId: storage.blockId, parentSchemaId: storage.parentSchemaId },
    _max: { order: true },
  });

  return (max._max.order ?? 0) + 10;
};

export const materializeParallelTree = async (
  tx: TxClient,
  planId: string,
  scope: CreateScope,
  data: ParallelSchemasBodyData,
): Promise<SchemaWithBody> => {
  await assertPlanWritable(tx, planId);

  const storage = await resolveStorageScope(tx, planId, scope);
  const parentOrder = await nextOrderInScope(tx, storage);

  const parent = await tx.schema.create({
    data: {
      blockId: storage.blockId,
      parentSchemaId: storage.parentSchemaId,
      order: parentOrder,
      header: data.header ?? null,
      composition: toInputJson({} satisfies Composition),
    },
  });

  for (const [index, track] of data.tracks.entries()) {
    await tx.schema.create({
      data: {
        blockId: storage.blockId,
        parentSchemaId: parent.id,
        order: (index + 1) * 10,
        header: track.header ?? null,
        composition: toInputJson({
          repetition: { kind: "ladder", steps: track.steps },
        } satisfies Composition),
      },
    });
  }

  const flat = await tx.schema.findMany({
    where: { blockId: storage.blockId },
    include: { rows: { orderBy: { order: "asc" } } },
  });
  const subtree = buildSchemaSubtree(flat, parent.id);

  assertComposeTreeValidForWrite(subtree);

  return subtree;
};
