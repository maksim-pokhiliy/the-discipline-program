import { Prisma } from "@prisma/client";

import {
  type CreateSchemaData,
  type ReorderSchemasData,
  type Schema,
  type UpdateSchemaData,
} from "@repo/contracts/lms/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyPlanEditable,
  verifySchemaOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSchema } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";

import { assertArchetypeConsistency, assertSubSchemaInvariants } from "./assertions";

type CreateScope = { blockId: string } | { parentSchemaId: string };

type SchemaBodyData = Omit<CreateSchemaData, "blockId" | "parentSchemaId">;

const STRUCTURAL_UPDATE_KEYS = ["kind", "archetypeId", "parentSchemaId", "blockId"] as const;

export const lmsSchemaApi = {
  create: async (
    userId: string,
    planId: string,
    scope: CreateScope,
    data: SchemaBodyData,
  ): Promise<Schema> => {
    const owner =
      "blockId" in scope
        ? await verifyBlockOwnership(scope.blockId, userId)
        : await verifySchemaOwnership(scope.parentSchemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Scope target not found in plan", {
        planId,
        scope,
      });
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

            let storageBlockId: string;
            let storageParentSchemaId: string | null;

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

              storageBlockId = scope.blockId;
              storageParentSchemaId = null;
            } else {
              const parent = await tx.schema.findUnique({
                where: { id: scope.parentSchemaId },
                select: {
                  id: true,
                  kind: true,
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

              assertSubSchemaInvariants(parent.kind, data.kind);

              storageBlockId = parent.blockId;
              storageParentSchemaId = scope.parentSchemaId;
            }

            await assertArchetypeConsistency(
              tx,
              data.archetypeId,
              data.kind,
              data.archetypeParams.archetype,
            );

            const max = await tx.schema.aggregate({
              where: {
                blockId: storageBlockId,
                parentSchemaId: storageParentSchemaId,
              },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            return tx.schema.create({
              data: {
                blockId: storageBlockId,
                parentSchemaId: storageParentSchemaId,
                order: nextOrder,
                kind: data.kind,
                archetypeId: data.archetypeId,
                header: data.header ?? null,
                archetypeParams: toInputJson(data.archetypeParams),
                intensity:
                  data.intensity === undefined || data.intensity === null
                    ? Prisma.JsonNull
                    : toInputJson(data.intensity),
                trailingConnector:
                  data.trailingConnector === undefined || data.trailingConnector === null
                    ? Prisma.JsonNull
                    : toInputJson(data.trailingConnector),
                notes: data.notes ?? null,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToSchema(created);
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

    if (data.archetypeParams !== undefined) {
      const current = await prisma.schema.findUnique({
        where: { id: schemaId },
        select: { archetype: { select: { name: true } } },
      });

      if (!current) {
        throw new NotFoundError("Schema not found", { schemaId });
      }

      if (current.archetype.name !== data.archetypeParams.archetype) {
        throw new BadRequestError(
          "archetypeParams variant must match current Archetype on update; structural change requires delete + recreate",
          {
            current: current.archetype.name,
            provided: data.archetypeParams.archetype,
          },
        );
      }
    }

    try {
      const updated = await prisma.schema.update({
        where: { id: schemaId },
        data: {
          ...(data.archetypeParams !== undefined && {
            archetypeParams: toInputJson(data.archetypeParams),
          }),
          ...(data.header !== undefined && { header: data.header }),
          ...(data.intensity !== undefined && {
            intensity: data.intensity === null ? Prisma.JsonNull : toInputJson(data.intensity),
          }),
          ...(data.trailingConnector !== undefined && {
            trailingConnector:
              data.trailingConnector === null
                ? Prisma.JsonNull
                : toInputJson(data.trailingConnector),
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
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
      await prisma.schema.delete({ where: { id: schemaId } });
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
    const owner =
      "blockId" in scope
        ? await verifyBlockOwnership(scope.blockId, userId)
        : await verifySchemaOwnership(scope.parentSchemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Scope target not found in plan", { planId, scope });
    }

    verifyPlanEditable(owner);

    const scopeWhere =
      "blockId" in scope
        ? { blockId: scope.blockId, parentSchemaId: null }
        : { parentSchemaId: scope.parentSchemaId };

    const schemas = await prisma.schema.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, blockId: true, parentSchemaId: true },
    });

    if (schemas.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent schemas", {
        missing: data.orderedIds.filter((id) => !schemas.some((s) => s.id === id)),
      });
    }

    const foreignIds =
      "blockId" in scope
        ? schemas.filter((s) => s.blockId !== scope.blockId || s.parentSchemaId !== null)
        : schemas.filter((s) => s.parentSchemaId !== scope.parentSchemaId);

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
