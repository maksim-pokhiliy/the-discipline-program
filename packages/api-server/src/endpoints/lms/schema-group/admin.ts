import { Prisma } from "@prisma/client";

import {
  type CreateGroupRequest,
  type CreateGroupResponse,
  type SchemaGroup,
  type UpdateGroupRequest,
} from "@repo/contracts/lms/schema-group";
import { BadRequestError, NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyGroupOwnership,
  verifyPlanEditable,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSchemaGroup, mapToSchemaWithBody } from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import { SCHEMA_BODY_INCLUDE, type TxClient } from "../_shared";
import { assertGroupMembersContiguous } from "../schema/assertions";

const createSchemaGroupWrapping = async (
  tx: TxClient,
  data: CreateGroupRequest,
): Promise<CreateGroupResponse> => {
  const group = await tx.schemaGroup.create({
    data: {
      blockId: data.blockId,
      notes: marshalNullableJson(data.notes),
      ...(data.interleaveOrder !== undefined && { interleaveOrder: data.interleaveOrder }),
    },
  });

  const namedSchemas = await tx.schema.findMany({
    where: { id: { in: [...data.schemaIds] } },
    select: { id: true, blockId: true, groupId: true },
  });

  if (namedSchemas.length !== data.schemaIds.length) {
    throw new BadRequestError("Some schemaIds reference non-existent schemas", {
      missing: data.schemaIds.filter((id) => !namedSchemas.some((s) => s.id === id)),
    });
  }

  const foreignSchemas = namedSchemas.filter((s) => s.blockId !== data.blockId);

  if (foreignSchemas.length > 0) {
    throw new BadRequestError("Some schemaIds do not belong to the target block", {
      foreignIds: foreignSchemas.map((s) => s.id),
    });
  }

  const alreadyGrouped = namedSchemas.filter((s) => s.groupId !== null);

  if (alreadyGrouped.length > 0) {
    throw new BadRequestError("Some schemaIds are already in a group", {
      groupedIds: alreadyGrouped.map((s) => s.id),
    });
  }

  await tx.schema.updateMany({
    where: { id: { in: [...data.schemaIds] } },
    data: { groupId: group.id },
  });

  const blockSchemas = await tx.schema.findMany({
    where: { blockId: data.blockId },
    select: { id: true, groupId: true, order: true },
  });

  assertGroupMembersContiguous(blockSchemas, group.id);

  const members = await tx.schema.findMany({
    where: { groupId: group.id },
    orderBy: { order: "asc" },
    include: SCHEMA_BODY_INCLUDE,
  });

  return {
    group: mapToSchemaGroup(group),
    members: members.map(mapToSchemaWithBody),
  };
};

export const lmsSchemaGroupApi = {
  create: async (
    userId: string,
    planId: string,
    data: CreateGroupRequest,
  ): Promise<CreateGroupResponse> => {
    const owner = await verifyBlockOwnership(data.blockId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Block not found in plan", { planId, blockId: data.blockId });
    }

    verifyPlanEditable(owner);

    try {
      return await retryOnP2034(() =>
        prisma.$transaction((tx) => createSchemaGroupWrapping(tx, data), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }),
      );
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaGroup" });
    }
  },

  update: async (
    userId: string,
    groupId: string,
    data: UpdateGroupRequest,
  ): Promise<SchemaGroup> => {
    const owner = await verifyGroupOwnership(groupId, userId);

    verifyPlanEditable(owner);

    try {
      const updated = await prisma.schemaGroup.update({
        where: { id: groupId },
        data: {
          ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
          ...(data.interleaveOrder !== undefined && { interleaveOrder: data.interleaveOrder }),
        },
      });

      return mapToSchemaGroup(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaGroup" });
    }
  },

  delete: async (userId: string, groupId: string): Promise<void> => {
    const owner = await verifyGroupOwnership(groupId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.schemaGroup.delete({ where: { id: groupId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaGroup" });
    }
  },
};
