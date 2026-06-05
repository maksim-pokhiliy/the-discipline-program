import { Prisma } from "@prisma/client";

import {
  type CreateSchemaRowData,
  type ReorderSchemaRowsData,
  type SchemaRow,
  type UpdateSchemaRowData,
} from "@repo/contracts/lms/schema-row";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@repo/errors";

import {
  verifyPlanEditable,
  verifySchemaOwnership,
  verifySchemaRowOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  assertComposeTreeValidForWrite,
  buildSchemaWithBody,
  mapToSchemaRow,
} from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034, toInputJson } from "../../../utils";

import { assertRowKindPayloadAlignment } from "./assertions";

const STRUCTURAL_UPDATE_KEYS = ["rowKind", "schemaId"] as const;

export const lmsSchemaRowApi = {
  create: async (userId: string, planId: string, data: CreateSchemaRowData): Promise<SchemaRow> => {
    const owner = await verifySchemaOwnership(data.schemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Schema not found in plan", { planId, schemaId: data.schemaId });
    }

    verifyPlanEditable(owner);

    assertRowKindPayloadAlignment(data.rowKind, data.rowPayload.rowKind);

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
                id: true,
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
                rowKind: data.rowKind,
                rowPayload: toInputJson(data.rowPayload),
                load: marshalNullableJson(data.load),
                reps: marshalNullableJson(data.reps),
                side: marshalNullableJson(data.side),
                tempo: marshalNullableJson(data.tempo),
                position: data.position ?? null,
                sequence: marshalNullableJson(data.sequence),
                intensity: marshalNullableJson(data.intensity),
                media: marshalNullableJson(data.media),
                compoundRep: marshalNullableJson(data.compoundRep),
                notes: data.notes ?? null,
              },
            });

            const full = await tx.schema.findUnique({
              where: { id: data.schemaId },
              include: {
                rows: { orderBy: { order: "asc" } },
                subSchemas: {
                  orderBy: { order: "asc" },
                  include: { rows: { orderBy: { order: "asc" } } },
                },
              },
            });

            if (full === null) {
              throw new InternalServerError("Parent schema vanished mid-transaction", {
                kind: "DbCorruption",
                entity: "Schema",
                schemaId: data.schemaId,
              });
            }

            assertComposeTreeValidForWrite(buildSchemaWithBody(full));

            return createdRow;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToSchemaRow(created);
    } catch (error) {
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

    const mutatedStructural = STRUCTURAL_UPDATE_KEYS.filter((k) => data[k] !== undefined);

    if (mutatedStructural.length > 0) {
      throw new BadRequestError(
        "SchemaRow structural fields are immutable; delete + recreate to change",
        { fields: mutatedStructural },
      );
    }

    if (data.rowPayload !== undefined) {
      const nextRowPayload = data.rowPayload;

      const current = await prisma.schemaRow.findUnique({
        where: { id: schemaRowId },
        include: {
          schema: {
            include: {
              rows: { orderBy: { order: "asc" } },
              subSchemas: {
                orderBy: { order: "asc" },
                include: { rows: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundError("SchemaRow not found", { schemaRowId });
      }

      assertRowKindPayloadAlignment(current.rowKind, nextRowPayload.rowKind);

      const node = buildSchemaWithBody(current.schema);

      assertComposeTreeValidForWrite({
        ...node,
        rows: node.rows.map((row) =>
          row.id === schemaRowId ? { ...row, rowPayload: nextRowPayload } : row,
        ),
      });
    }

    try {
      const updated = await prisma.schemaRow.update({
        where: { id: schemaRowId },
        data: {
          ...(data.rowPayload !== undefined && { rowPayload: toInputJson(data.rowPayload) }),
          ...(data.load !== undefined && { load: marshalNullableJson(data.load) }),
          ...(data.reps !== undefined && { reps: marshalNullableJson(data.reps) }),
          ...(data.side !== undefined && { side: marshalNullableJson(data.side) }),
          ...(data.tempo !== undefined && { tempo: marshalNullableJson(data.tempo) }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.sequence !== undefined && { sequence: marshalNullableJson(data.sequence) }),
          ...(data.intensity !== undefined && { intensity: marshalNullableJson(data.intensity) }),
          ...(data.media !== undefined && { media: marshalNullableJson(data.media) }),
          ...(data.compoundRep !== undefined && {
            compoundRep: marshalNullableJson(data.compoundRep),
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      return mapToSchemaRow(updated);
    } catch (error) {
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
      select: { id: true, schemaId: true },
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

    try {
      const updated = await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.schemaRow.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.schemaRow.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      return updated.slice(data.orderedIds.length).map(mapToSchemaRow);
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },
};
