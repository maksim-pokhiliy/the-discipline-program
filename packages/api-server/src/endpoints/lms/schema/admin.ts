import { Prisma } from "@prisma/client";

import {
  type CreateSchemaData,
  type ReorderSchemasData,
  type Schema,
  type UpdateSchemaData,
} from "@repo/contracts/lms/schema";
import { BadRequestError, NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyPlanEditable,
  verifySchemaOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSchema } from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import { deepCloneSchema, SCHEMA_BODY_INCLUDE, type TxClient } from "../_shared";

import { assertCompositionUpdateValid, assertGroupMembersContiguous } from "./assertions";
import {
  assertPlanWritable,
  type CreateScope,
  nextOrderInScope,
  resolveStorageScope,
} from "./create-steps";

type SchemaBodyData = Omit<CreateSchemaData, "blockId">;

const ORDER_STEP = 10;

const STRUCTURAL_UPDATE_KEYS = ["blockId", "groupId"] as const;

const resolveGroupedOrder = async (
  tx: TxClient,
  blockId: string,
  groupId: string,
): Promise<number> => {
  const group = await tx.schemaGroup.findUnique({
    where: { id: groupId },
    select: { blockId: true },
  });

  if (group === null || group.blockId !== blockId) {
    throw new BadRequestError("Group does not belong to the target block", { groupId, blockId });
  }

  const blockSchemas = await tx.schema.findMany({
    where: { blockId },
    select: { id: true, order: true, groupId: true },
  });
  const memberOrders = blockSchemas
    .filter((s) => s.groupId === groupId)
    .map((s) => s.order)
    .sort((a, b) => a - b);

  if (memberOrders.length === 0) {
    return nextOrderInScope(tx, { blockId });
  }

  const lastMemberOrder = memberOrders[memberOrders.length - 1] ?? 0;

  const shifted = blockSchemas
    .filter((s) => s.order > lastMemberOrder)
    .sort((a, b) => b.order - a.order);

  for (const s of shifted) {
    await tx.schema.update({ where: { id: s.id }, data: { order: s.order + ORDER_STEP } });
  }

  return lastMemberOrder + ORDER_STEP;
};

export const lmsSchemaApi = {
  create: async (
    userId: string,
    planId: string,
    scope: CreateScope,
    data: SchemaBodyData,
  ): Promise<Schema> => {
    const owner = await verifyBlockOwnership(scope.blockId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Scope target not found in plan", { planId, scope });
    }

    verifyPlanEditable(owner);

    try {
      const created = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanWritable(tx, planId);

            const storage = await resolveStorageScope(tx, planId, scope);
            const groupId = data.groupId ?? null;
            const nextOrder =
              groupId === null
                ? await nextOrderInScope(tx, storage)
                : await resolveGroupedOrder(tx, storage.blockId, groupId);

            const created = await tx.schema.create({
              data: {
                blockId: storage.blockId,
                groupId,
                order: nextOrder,
                header: data.header ?? null,
                intensity: marshalNullableJson(data.intensity),
                composition: marshalNullableJson(data.composition),
                notes: marshalNullableJson(data.notes),
              },
            });

            if (groupId !== null) {
              const blockSchemas = await tx.schema.findMany({
                where: { blockId: storage.blockId },
                select: { id: true, order: true, groupId: true },
              });

              assertGroupMembersContiguous(blockSchemas, groupId);
            }

            if (data.composition !== undefined) {
              await assertCompositionUpdateValid(tx, created.id, data.composition);
            }

            return created;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToSchema(created);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  duplicate: async (userId: string, planId: string, schemaId: string): Promise<Schema> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Schema not found in plan", { planId, schemaId });
    }

    verifyPlanEditable(owner);

    try {
      const reloaded = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanWritable(tx, planId);

            const source = await tx.schema.findUniqueOrThrow({
              where: { id: schemaId },
              include: SCHEMA_BODY_INCLUDE,
            });

            const nextOrder =
              source.groupId === null
                ? await nextOrderInScope(tx, { blockId: owner.blockId })
                : await resolveGroupedOrder(tx, owner.blockId, source.groupId);

            const newId = await deepCloneSchema(
              tx,
              source,
              owner.blockId,
              nextOrder,
              source.groupId,
            );

            if (source.groupId !== null) {
              const blockSchemas = await tx.schema.findMany({
                where: { blockId: owner.blockId },
                select: { id: true, order: true, groupId: true },
              });

              assertGroupMembersContiguous(blockSchemas, source.groupId);
            }

            return tx.schema.findUniqueOrThrow({
              where: { id: newId },
              include: SCHEMA_BODY_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
        ),
      );

      return mapToSchema(reloaded);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  update: async (userId: string, schemaId: string, data: UpdateSchemaData): Promise<Schema> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    verifyPlanEditable(owner);

    const mutatedStructural = STRUCTURAL_UPDATE_KEYS.filter((k) => data[k] !== undefined);

    if (mutatedStructural.length > 0) {
      throw new BadRequestError(
        "Schema structural fields are immutable; delete + recreate to change",
        { fields: mutatedStructural },
      );
    }

    if (data.composition !== undefined) {
      await assertCompositionUpdateValid(prisma, schemaId, data.composition);
    }

    try {
      const updated = await prisma.schema.update({
        where: { id: schemaId },
        data: {
          ...(data.header !== undefined && { header: data.header }),
          ...(data.intensity !== undefined && {
            intensity: marshalNullableJson(data.intensity),
          }),
          ...(data.composition !== undefined && {
            composition: marshalNullableJson(data.composition),
          }),
          ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
        },
      });

      return mapToSchema(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  delete: async (userId: string, schemaId: string): Promise<void> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    verifyPlanEditable(owner);

    try {
      await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            const target = await tx.schema.findUnique({
              where: { id: schemaId },
              select: { groupId: true },
            });

            if (target === null) {
              throw new NotFoundError("Schema not found", { schemaId });
            }

            await tx.schema.delete({ where: { id: schemaId } });

            if (target.groupId !== null) {
              const remaining = await tx.schema.count({ where: { groupId: target.groupId } });

              if (remaining === 0) {
                await tx.schemaGroup.delete({ where: { id: target.groupId } });
              }
            }
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    scope: CreateScope,
    data: ReorderSchemasData,
  ): Promise<Schema[]> => {
    const owner = await verifyBlockOwnership(scope.blockId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Scope target not found in plan", { planId, scope });
    }

    verifyPlanEditable(owner);

    const scopeWhere = { blockId: scope.blockId };

    const schemas = await prisma.schema.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, blockId: true, groupId: true },
    });

    if (schemas.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent schemas", {
        missing: data.orderedIds.filter((id) => !schemas.some((s) => s.id === id)),
      });
    }

    const foreignIds = schemas.filter((s) => s.blockId !== scope.blockId);

    if (foreignIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target scope", {
        foreignIds: foreignIds.map((s) => s.id),
      });
    }

    const scopeCount = await prisma.schema.count({ where: scopeWhere });

    if (data.orderedIds.length !== scopeCount) {
      throw new BadRequestError("orderedIds must include every schema in the target scope", {
        provided: data.orderedIds.length,
        expected: scopeCount,
      });
    }

    const groupById = new Map(schemas.map((s) => [s.id, s.groupId]));
    const reorderedBlockSchemas = data.orderedIds.map((id, i) => ({
      id,
      groupId: groupById.get(id) ?? null,
      order: (i + 1) * ORDER_STEP,
    }));
    const groupIds = new Set(
      reorderedBlockSchemas.flatMap((s) => (s.groupId === null ? [] : [s.groupId])),
    );

    for (const groupId of groupIds) {
      assertGroupMembersContiguous(reorderedBlockSchemas, groupId);
    }

    try {
      const updated = await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.schema.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.schema.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      return updated.slice(data.orderedIds.length).map(mapToSchema);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },
};
