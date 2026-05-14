import { type UpdateWeekNotesData, type Week } from "@repo/contracts/lms/week";
import { BadRequestError } from "@repo/errors";
import { getMonday, parseDateParam } from "@repo/shared";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToWeek } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";

const parseStartDate = (param: string): Date => {
  const parsed = parseDateParam(param);

  if (parsed === null) {
    throw new BadRequestError("startDate must be a valid YYYY-MM-DD date", {
      field: "startDate",
    });
  }

  return parsed;
};

const resolveWeekStartDate = (startDateParam: string): Date => {
  const monday = getMonday(parseStartDate(startDateParam));

  return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
};

export const lmsWeekApi = {
  getByPlanAndDate: async (
    userId: string,
    planId: string,
    startDateParam: string,
  ): Promise<Week | null> => {
    await verifyPlanOwnership(planId, userId);

    const startDate = resolveWeekStartDate(startDateParam);

    const week = await prisma.week.findUnique({
      where: { planId_startDate: { planId, startDate } },
    });

    return week ? mapToWeek(week) : null;
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
