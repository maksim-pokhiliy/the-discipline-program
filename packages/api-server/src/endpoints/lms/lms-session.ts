import {
  type CreateLmsSessionInput,
  type UpdateLmsSessionInput,
} from "@repo/contracts/lms/lms-session";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToLmsSession } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { resolvePlanIdForDay, resolvePlanIdForSession } from "./plan-tree-helpers";

export const lmsLmsSessionApi = {
  getById: async (userId: string, sessionId: string) => {
    const planId = await resolvePlanIdForSession(sessionId);

    await verifyPlanOwnership(planId, userId);

    const session = await findOrThrow(
      prisma.lmsSession.findUnique({ where: { id: sessionId } }),
      "Session",
    );

    return mapToLmsSession(session);
  },

  create: async (userId: string, data: CreateLmsSessionInput) => {
    const planId = await resolvePlanIdForDay(data.dayId);

    await verifyPlanOwnership(planId, userId);

    try {
      const session = await prisma.lmsSession.create({
        data: {
          dayId: data.dayId,
          order: data.order,
          label: data.label ?? null,
          notes: data.notes ?? null,
        },
      });

      return mapToLmsSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session", field: "order" });
    }
  },

  update: async (userId: string, sessionId: string, data: UpdateLmsSessionInput) => {
    const planId = await resolvePlanIdForSession(sessionId);

    await verifyPlanOwnership(planId, userId);

    try {
      const session = await prisma.lmsSession.update({
        where: { id: sessionId },
        data: {
          ...(data.order !== undefined ? { order: data.order } : {}),
          ...(data.label !== undefined ? { label: data.label } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      return mapToLmsSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session", field: "order" });
    }
  },

  delete: async (userId: string, sessionId: string): Promise<void> => {
    const planId = await resolvePlanIdForSession(sessionId);

    await verifyPlanOwnership(planId, userId);

    try {
      await prisma.lmsSession.delete({ where: { id: sessionId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },
};
