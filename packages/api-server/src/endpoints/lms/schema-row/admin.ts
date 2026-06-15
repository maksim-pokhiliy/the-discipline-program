import { Prisma } from "@prisma/client";

import {
  type CreateSchemaRowData,
  type ReorderSchemaRowsData,
  type SchemaRow,
  type UpdateSchemaRowData,
} from "@repo/contracts/lms/schema-row";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyPlanEditable,
  verifySchemaOwnership,
  verifySchemaRowOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  assertComposeTreeValidForWrite,
  mapToSchemaRow,
  mapToSchemaWithBody,
} from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import { deepCloneRow, SCHEMA_BODY_INCLUDE, type TxClient } from "../_shared";
import { assertPlanWritable } from "../schema/create-steps";

import { assertRowGroupMembersContiguous } from "./assertions";
import { nextRowOrderInSchema, resolveRowGroupedOrder } from "./create-steps";

const ORDER_STEP = 10;

const getFkFieldName = (error: Prisma.PrismaClientKnownRequestError): string => {
  const fieldName = error.meta?.field_name;

  return typeof fieldName === "string" ? fieldName : "unknown";
};

const replaceRowModifiers = async (
  tx: TxClient,
  rowId: string,
  modifierIds: readonly string[],
): Promise<void> => {
  await tx.rowModifierAssignment.deleteMany({ where: { rowId } });

  if (modifierIds.length > 0) {
    await tx.rowModifierAssignment.createMany({
      data: modifierIds.map((modifierId, i) => ({ rowId, modifierId, order: i })),
    });
  }
};

const loadRowWithModifiers = async (tx: TxClient, rowId: string): Promise<SchemaRow> => {
  const row = await tx.schemaRow.findUniqueOrThrow({
    where: { id: rowId },
    include: SCHEMA_BODY_INCLUDE.rows.include,
  });

  return mapToSchemaRow(row);
};

const revalidateSchemaTree = async (tx: TxClient, schemaId: string): Promise<void> => {
  const schemaWithBody = await tx.schema.findUniqueOrThrow({
    where: { id: schemaId },
    include: SCHEMA_BODY_INCLUDE,
  });

  assertComposeTreeValidForWrite(mapToSchemaWithBody(schemaWithBody));
};

export const lmsSchemaRowApi = {
  create: async (userId: string, planId: string, data: CreateSchemaRowData): Promise<SchemaRow> => {
    const owner = await verifySchemaOwnership(data.schemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Schema not found in plan", { planId, schemaId: data.schemaId });
    }

    verifyPlanEditable(owner);

    try {
      const created = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
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

            const parent = await tx.schema.findUnique({
              where: { id: data.schemaId },
              select: {
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
                schemaId: data.schemaId,
                planId,
              });
            }

            const max = await tx.schemaRow.aggregate({
              where: { schemaId: data.schemaId },
              _max: { order: true },
            });
            const nextOrder = (max._max.order ?? 0) + 10;

            const createdRow = await tx.schemaRow.create({
              data: {
                schemaId: data.schemaId,
                order: nextOrder,
                exerciseId: data.exerciseId,
                sets: data.sets ?? null,
                load: marshalNullableJson(data.load),
                reps: marshalNullableJson(data.reps),
                side: marshalNullableJson(data.side),
                tempo: marshalNullableJson(data.tempo),
                media: marshalNullableJson(data.media),
                notes: marshalNullableJson(data.notes),
              },
            });

            await replaceRowModifiers(tx, createdRow.id, data.modifierIds ?? []);

            await revalidateSchemaTree(tx, data.schemaId);

            return loadRowWithModifiers(tx, createdRow.id);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return created;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestError("Referenced exercise or modifier does not exist", {
          field: getFkFieldName(error),
        });
      }

      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },

  duplicate: async (userId: string, planId: string, schemaRowId: string): Promise<SchemaRow> => {
    const owner = await verifySchemaRowOwnership(schemaRowId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("SchemaRow not found in plan", { planId, schemaRowId });
    }

    verifyPlanEditable(owner);

    try {
      const duplicated = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanWritable(tx, planId);

            const source = await tx.schemaRow.findUniqueOrThrow({
              where: { id: schemaRowId },
              include: SCHEMA_BODY_INCLUDE.rows.include,
            });

            const nextOrder =
              source.rowGroupId === null
                ? await nextRowOrderInSchema(tx, owner.schemaId)
                : await resolveRowGroupedOrder(tx, owner.schemaId, source.rowGroupId);

            const newId = await deepCloneRow(
              tx,
              source,
              owner.schemaId,
              nextOrder,
              source.rowGroupId,
            );

            await revalidateSchemaTree(tx, owner.schemaId);

            if (source.rowGroupId !== null) {
              const schemaRows = await tx.schemaRow.findMany({
                where: { schemaId: owner.schemaId },
                select: { id: true, order: true, rowGroupId: true },
              });

              assertRowGroupMembersContiguous(schemaRows, source.rowGroupId);
            }

            return loadRowWithModifiers(tx, newId);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return duplicated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestError("Referenced exercise or modifier does not exist", {
          field: getFkFieldName(error),
        });
      }

      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },

  update: async (
    userId: string,
    schemaRowId: string,
    data: UpdateSchemaRowData,
  ): Promise<SchemaRow> => {
    const owner = await verifySchemaRowOwnership(schemaRowId, userId);

    verifyPlanEditable(owner);

    try {
      const updated = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await tx.schemaRow.update({
              where: { id: schemaRowId },
              data: {
                ...(data.sets !== undefined && { sets: data.sets }),
                ...(data.load !== undefined && { load: marshalNullableJson(data.load) }),
                ...(data.reps !== undefined && { reps: marshalNullableJson(data.reps) }),
                ...(data.side !== undefined && { side: marshalNullableJson(data.side) }),
                ...(data.tempo !== undefined && { tempo: marshalNullableJson(data.tempo) }),
                ...(data.media !== undefined && { media: marshalNullableJson(data.media) }),
                ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
              },
            });

            if (data.modifierIds !== undefined) {
              await replaceRowModifiers(tx, schemaRowId, data.modifierIds);
            }

            await revalidateSchemaTree(tx, owner.schemaId);

            return loadRowWithModifiers(tx, schemaRowId);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestError("Referenced modifier does not exist", {
          field: getFkFieldName(error),
        });
      }

      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },

  delete: async (userId: string, schemaRowId: string): Promise<void> => {
    const owner = await verifySchemaRowOwnership(schemaRowId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.schemaRow.delete({ where: { id: schemaRowId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    schemaId: string,
    data: ReorderSchemaRowsData,
  ): Promise<SchemaRow[]> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Schema not found in plan", { planId, schemaId });
    }

    verifyPlanEditable(owner);

    const rows = await prisma.schemaRow.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, schemaId: true, rowGroupId: true },
    });

    if (rows.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent rows", {
        missing: data.orderedIds.filter((id) => !rows.some((r) => r.id === id)),
      });
    }

    const foreignIds = rows.filter((r) => r.schemaId !== schemaId);

    if (foreignIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target schema", {
        foreignIds: foreignIds.map((r) => r.id),
      });
    }

    const scopeCount = await prisma.schemaRow.count({ where: { schemaId } });

    if (data.orderedIds.length !== scopeCount) {
      throw new BadRequestError("orderedIds must include every row in the target schema", {
        provided: data.orderedIds.length,
        expected: scopeCount,
      });
    }

    const rowGroupById = new Map(rows.map((r) => [r.id, r.rowGroupId]));
    const reorderedRows = data.orderedIds.map((id, i) => ({
      id,
      rowGroupId: rowGroupById.get(id) ?? null,
      order: (i + 1) * ORDER_STEP,
    }));
    const rowGroupIds = new Set(
      reorderedRows.flatMap((r) => (r.rowGroupId === null ? [] : [r.rowGroupId])),
    );

    for (const rowGroupId of rowGroupIds) {
      assertRowGroupMembersContiguous(reorderedRows, rowGroupId);
    }

    try {
      await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.schemaRow.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.schemaRow.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      const reordered = await prisma.schemaRow.findMany({
        where: { schemaId },
        orderBy: { order: "asc" },
        include: SCHEMA_BODY_INCLUDE.rows.include,
      });

      return reordered.map(mapToSchemaRow);
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },
};
