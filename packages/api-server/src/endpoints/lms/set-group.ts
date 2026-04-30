import { Prisma } from "@prisma/client";

import { type CreateSetGroupInput, type UpdateSetGroupInput } from "@repo/contracts/lms/set-group";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToSetGroup } from "../../mappers/lms";
import { findOrThrow, handlePrismaError, toInputJson } from "../../utils";

import { resolvePlanIdForBlockSegment, resolvePlanIdForSetGroup } from "./plan-tree-helpers";

export const lmsSetGroupApi = {
  getById: async (userId: string, setGroupId: string) => {
    const planId = await resolvePlanIdForSetGroup(setGroupId);

    await verifyPlanOwnership(planId, userId);

    const setGroup = await findOrThrow(
      prisma.setGroup.findUnique({ where: { id: setGroupId } }),
      "Set group",
    );

    return mapToSetGroup(setGroup);
  },

  create: async (userId: string, data: CreateSetGroupInput) => {
    const planId = await resolvePlanIdForBlockSegment(data.segmentId);

    await verifyPlanOwnership(planId, userId);

    try {
      const setGroup = await prisma.setGroup.create({
        data: {
          segmentId: data.segmentId,
          order: data.order,
          label: data.label ?? null,
          restConfig:
            data.restConfig === undefined ? Prisma.JsonNull : toInputJson(data.restConfig),
        },
      });

      return mapToSetGroup(setGroup);
    } catch (error) {
      return handlePrismaError(error, { entity: "Set group" });
    }
  },

  update: async (userId: string, setGroupId: string, data: UpdateSetGroupInput) => {
    const planId = await resolvePlanIdForSetGroup(setGroupId);

    await verifyPlanOwnership(planId, userId);

    try {
      const setGroup = await prisma.setGroup.update({
        where: { id: setGroupId },
        data: {
          ...(data.order !== undefined ? { order: data.order } : {}),
          ...(data.label !== undefined ? { label: data.label } : {}),
          ...(data.restConfig !== undefined
            ? {
                restConfig:
                  data.restConfig === null ? Prisma.JsonNull : toInputJson(data.restConfig),
              }
            : {}),
        },
      });

      return mapToSetGroup(setGroup);
    } catch (error) {
      return handlePrismaError(error, { entity: "Set group" });
    }
  },

  delete: async (userId: string, setGroupId: string): Promise<void> => {
    const planId = await resolvePlanIdForSetGroup(setGroupId);

    await verifyPlanOwnership(planId, userId);

    try {
      await prisma.setGroup.delete({ where: { id: setGroupId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Set group" });
    }
  },
};
