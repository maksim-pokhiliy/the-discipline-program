import { Prisma } from "@prisma/client";

import {
  type CreateRowGroupRequest,
  type CreateRowGroupResponse,
  type RowGroup,
  type UpdateRowGroupRequest,
} from "@repo/contracts/lms/row-group";
import { BadRequestError, NotFoundError } from "@repo/errors";

import {
  verifyPlanEditable,
  verifyRowGroupOwnership,
  verifySchemaOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToRowGroup, mapToSchemaRow } from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import { SCHEMA_BODY_INCLUDE, type TxClient } from "../_shared";
import { assertRowGroupMembersContiguous } from "../schema-row/assertions";

const createRowGroupWrapping = async (
  tx: TxClient,
  data: CreateRowGroupRequest,
): Promise<CreateRowGroupResponse> => {
  const group = await tx.rowGroup.create({
    data: {
      schemaId: data.schemaId,
      notes: marshalNullableJson(data.notes),
    },
  });

  const namedRows = await tx.schemaRow.findMany({
    where: { id: { in: [...data.rowIds] } },
    select: { id: true, schemaId: true },
  });

  if (namedRows.length !== data.rowIds.length) {
    throw new BadRequestError("Some rowIds reference non-existent rows", {
      missing: data.rowIds.filter((id) => !namedRows.some((r) => r.id === id)),
    });
  }

  const foreignRows = namedRows.filter((r) => r.schemaId !== data.schemaId);

  if (foreignRows.length > 0) {
    throw new BadRequestError("Some rowIds do not belong to the target schema", {
      foreignIds: foreignRows.map((r) => r.id),
    });
  }

  await tx.schemaRow.updateMany({
    where: { id: { in: [...data.rowIds] } },
    data: { rowGroupId: group.id },
  });

  const schemaRows = await tx.schemaRow.findMany({
    where: { schemaId: data.schemaId },
    select: { id: true, rowGroupId: true, order: true },
  });

  assertRowGroupMembersContiguous(schemaRows, group.id);

  const members = await tx.schemaRow.findMany({
    where: { rowGroupId: group.id },
    orderBy: { order: "asc" },
    include: SCHEMA_BODY_INCLUDE.rows.include,
  });

  return {
    group: mapToRowGroup(group),
    members: members.map(mapToSchemaRow),
  };
};

export const lmsRowGroupApi = {
  create: async (
    userId: string,
    planId: string,
    data: CreateRowGroupRequest,
  ): Promise<CreateRowGroupResponse> => {
    const owner = await verifySchemaOwnership(data.schemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Schema not found in plan", { planId, schemaId: data.schemaId });
    }

    verifyPlanEditable(owner);

    try {
      return await retryOnP2034(() =>
        prisma.$transaction((tx) => createRowGroupWrapping(tx, data), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }),
      );
    } catch (error) {
      return handlePrismaError(error, { entity: "RowGroup" });
    }
  },

  update: async (
    userId: string,
    rowGroupId: string,
    data: UpdateRowGroupRequest,
  ): Promise<RowGroup> => {
    const owner = await verifyRowGroupOwnership(rowGroupId, userId);

    verifyPlanEditable(owner);

    try {
      const updated = await prisma.rowGroup.update({
        where: { id: rowGroupId },
        data: {
          ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
        },
      });

      return mapToRowGroup(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "RowGroup" });
    }
  },

  delete: async (userId: string, rowGroupId: string): Promise<void> => {
    const owner = await verifyRowGroupOwnership(rowGroupId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.rowGroup.delete({ where: { id: rowGroupId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "RowGroup" });
    }
  },
};
