import { Prisma } from "@prisma/client";

import { type Composition } from "@repo/contracts/lms/composition";
import {
  type CreateGroupRequest,
  type CreateGroupResponse,
  type SchemaGroup,
  type UpdateGroupRequest,
} from "@repo/contracts/lms/schema-group";
import { NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyGroupOwnership,
  verifyPlanEditable,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSchemaGroup, mapToSchemaWithBody } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";
import { type TxClient } from "../_shared";
import { assertGroupMembersContiguous } from "../schema/assertions";
import { assertPlanWritable } from "../schema/create-steps";

const ORDER_STEP = 10;

const createGroupWithMembers = async (
  tx: TxClient,
  planId: string,
  data: CreateGroupRequest,
): Promise<CreateGroupResponse> => {
  await assertPlanWritable(tx, planId);

  const group = await tx.schemaGroup.create({
    data: {
      blockId: data.blockId,
      label: data.label ?? null,
      ...(data.interleaveOrder !== undefined && { interleaveOrder: data.interleaveOrder }),
    },
  });

  const tailAggregate = await tx.schema.aggregate({
    where: { blockId: data.blockId },
    _max: { order: true },
  });
  const tailOrder = tailAggregate._max.order ?? 0;

  const members = [];

  for (const [index, track] of data.tracks.entries()) {
    const member = await tx.schema.create({
      data: {
        blockId: data.blockId,
        groupId: group.id,
        order: tailOrder + (index + 1) * ORDER_STEP,
        header: track.header ?? null,
        composition: toInputJson({
          repetition: { kind: "ladder", steps: track.steps },
        } satisfies Composition),
      },
      include: { rows: { orderBy: { order: "asc" } } },
    });

    members.push(member);
  }

  const blockSchemas = await tx.schema.findMany({
    where: { blockId: data.blockId },
    select: { id: true, order: true, groupId: true },
  });

  assertGroupMembersContiguous(blockSchemas, group.id);

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
        prisma.$transaction((tx) => createGroupWithMembers(tx, planId, data), {
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
          ...(data.label !== undefined && { label: data.label }),
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
