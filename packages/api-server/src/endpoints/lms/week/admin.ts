import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import {
  type GetWeekResponse,
  type UpdateWeekNotesData,
  type Week,
} from "@repo/contracts/lms/week";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToDaySlot, mapToWeek } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";
import { DAY_OF_WEEK_TO_PRISMA, resolveWeekStartDate } from "../_shared";

export const lmsWeekApi = {
  getByPlanAndDate: async (
    userId: string,
    planId: string,
    startDateParam: string,
  ): Promise<GetWeekResponse> => {
    await verifyPlanOwnership(planId, userId);

    const startDate = resolveWeekStartDate(startDateParam);

    try {
      const week = await prisma.week.findUnique({
        where: { planId_startDate: { planId, startDate } },
        include: {
          days: {
            include: {
              label: true,
              sessions: {
                orderBy: { order: "asc" },
                include: {
                  label: true,
                  blocks: {
                    orderBy: { order: "asc" },
                    include: {
                      labelAssignments: {
                        orderBy: { order: "asc" },
                        include: { label: true },
                      },
                      schemas: {
                        orderBy: { order: "asc" },
                        include: {
                          rows: { orderBy: { order: "asc" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const dayMap = new Map(week?.days.map((d) => [d.dayOfWeek, d]) ?? []);
      const days = dayOfWeekValues.map((dow) =>
        mapToDaySlot(dow, dayMap.get(DAY_OF_WEEK_TO_PRISMA[dow]) ?? null),
      );

      return { week: week ? mapToWeek(week) : null, days };
    } catch (error) {
      return handlePrismaError(error, { entity: "Week" });
    }
  },

  upsertNotes: async (
    userId: string,
    planId: string,
    startDateParam: string,
    data: UpdateWeekNotesData,
  ): Promise<Week> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);

    try {
      const week = await prisma.week.upsert({
        where: { planId_startDate: { planId, startDate } },
        create: { planId, startDate, notes: data.notes },
        update: { notes: data.notes },
      });

      return mapToWeek(week);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week" });
    }
  },
};
