import { Prisma } from "@prisma/client";

import {
  type AlternatingGroup,
  type CreateAlternatingGroupData,
} from "@repo/contracts/lms/alternating-group";
import { BadRequestError, NotFoundError } from "@repo/errors";

import {
  verifyAlternatingGroupOwnership,
  verifyPlanEditable,
  verifySchemaOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToAlternatingGroup } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034 } from "../../../utils";

import {
  assertGroupMembersApplicable,
  assertMemberApplicable,
  assertPlanEditableInTx,
} from "./assertions";

const GROUP_WITH_SCHEMAS_INCLUDE = {
  schemas: { orderBy: { order: "asc" as const }, select: { id: true } },
} satisfies Prisma.AlternatingGroupInclude;

const SURVIVING_MEMBER_FLOOR = 2;

export const lmsAlternatingGroupApi = {
  create: async (
    userId: string,
    planId: string,
    data: CreateAlternatingGroupData,
  ): Promise<AlternatingGroup> => {
    for (const schemaId of data.schemaIds) {
      const owner = await verifySchemaOwnership(schemaId, userId);

      if (owner.planId !== planId) {
        throw new NotFoundError("Schema not found in plan", { planId, schemaId });
      }

      verifyPlanEditable(owner);
    }

    try {
      const group = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanEditableInTx(tx, planId);

            const blockId = await assertGroupMembersApplicable(tx, data.schemaIds);

            const created = await tx.alternatingGroup.create({
              data: {
                relationKind: data.relationKind,
                blockId,
                schemas: { connect: data.schemaIds.map((id) => ({ id })) },
              },
            });

            return tx.alternatingGroup.findUniqueOrThrow({
              where: { id: created.id },
              include: GROUP_WITH_SCHEMAS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToAlternatingGroup(group);
    } catch (error) {
      return handlePrismaError(error, { entity: "AlternatingGroup" });
    }
  },

  addMember: async (
    userId: string,
    groupId: string,
    schemaId: string,
  ): Promise<AlternatingGroup> => {
    const owner = await verifyAlternatingGroupOwnership(groupId, userId);

    verifyPlanEditable(owner);

    const schemaOwner = await verifySchemaOwnership(schemaId, userId);

    if (schemaOwner.planId !== owner.planId) {
      throw new NotFoundError("Schema not found in plan", { planId: owner.planId, schemaId });
    }

    try {
      const group = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanEditableInTx(tx, owner.planId);
            await assertMemberApplicable(tx, schemaId, groupId, owner.blockId);

            await tx.schema.update({
              where: { id: schemaId },
              data: { alternatingGroupId: groupId },
            });

            return tx.alternatingGroup.findUniqueOrThrow({
              where: { id: groupId },
              include: GROUP_WITH_SCHEMAS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToAlternatingGroup(group);
    } catch (error) {
      return handlePrismaError(error, { entity: "AlternatingGroup" });
    }
  },

  removeMember: async (
    userId: string,
    groupId: string,
    schemaId: string,
  ): Promise<AlternatingGroup | null> => {
    const owner = await verifyAlternatingGroupOwnership(groupId, userId);

    verifyPlanEditable(owner);

    try {
      const group = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanEditableInTx(tx, owner.planId);

            const schema = await tx.schema.findUnique({
              where: { id: schemaId },
              select: { alternatingGroupId: true },
            });

            if (!schema || schema.alternatingGroupId !== groupId) {
              throw new BadRequestError("Schema is not a member of this alternating group", {
                schemaId,
                groupId,
              });
            }

            const memberCount = await tx.schema.count({
              where: { alternatingGroupId: groupId },
            });

            if (memberCount <= SURVIVING_MEMBER_FLOOR) {
              await tx.alternatingGroup.delete({ where: { id: groupId } });

              return null;
            }

            await tx.schema.update({
              where: { id: schemaId },
              data: { alternatingGroupId: null },
            });

            return tx.alternatingGroup.findUniqueOrThrow({
              where: { id: groupId },
              include: GROUP_WITH_SCHEMAS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return group === null ? null : mapToAlternatingGroup(group);
    } catch (error) {
      return handlePrismaError(error, { entity: "AlternatingGroup" });
    }
  },

  delete: async (userId: string, groupId: string): Promise<void> => {
    const owner = await verifyAlternatingGroupOwnership(groupId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.alternatingGroup.delete({ where: { id: groupId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "AlternatingGroup" });
    }
  },
};
