import { type UpdateDayInput } from "@repo/contracts/lms/day";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { DAY_KIND_TO_PRISMA_MAP, mapToDay } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { resolvePlanIdForDay } from "./plan-tree-helpers";

export const lmsDayApi = {
  getById: async (userId: string, dayId: string) => {
    const planId = await resolvePlanIdForDay(dayId);

    await verifyPlanOwnership(planId, userId);

    const day = await findOrThrow(prisma.day.findUnique({ where: { id: dayId } }), "Day");

    return mapToDay(day);
  },

  update: async (userId: string, dayId: string, data: UpdateDayInput) => {
    const planId = await resolvePlanIdForDay(dayId);

    await verifyPlanOwnership(planId, userId);

    try {
      const day = await prisma.day.update({
        where: { id: dayId },
        data: {
          ...(data.kind ? { kind: DAY_KIND_TO_PRISMA_MAP[data.kind] } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      return mapToDay(day);
    } catch (error) {
      return handlePrismaError(error, { entity: "Day" });
    }
  },
};
