import {
  type CreatePlanDayRequest,
  type PlanDay,
  type UpdatePlanDayData,
} from "@repo/contracts/lms/plan-day";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../../authz/guards";
import { prisma } from "../../../../db/client";
import { mapToPlanDay } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../../utils";

const ensureDayTypeExists = async (dayTypeId: string): Promise<void> => {
  const dayType = await prisma.dayType.findUnique({
    where: { id: dayTypeId },
    select: { deletedAt: true },
  });

  if (!dayType || dayType.deletedAt !== null) {
    throw new BadRequestError("Referenced DayType does not exist", { field: "dayTypeId" });
  }
};

const findDayInPlan = async (planId: string, dayId: string): Promise<PlanDay> => {
  const day = await findOrThrow(prisma.planDay.findUnique({ where: { id: dayId } }), "PlanDay");

  if (day.planId !== planId) {
    throw new NotFoundError("PlanDay not found", { dayId });
  }

  return mapToPlanDay(day);
};

export const lmsPlanDayApi = {
  listByPlan: async (
    userId: string,
    planId: string,
    range: { from: Date; to: Date },
  ): Promise<PlanDay[]> => {
    await verifyPlanOwnership(planId, userId);

    const days = await prisma.planDay.findMany({
      where: { planId, date: { gte: range.from, lte: range.to } },
      orderBy: { date: "asc" },
    });

    return days.map(mapToPlanDay);
  },

  getById: async (userId: string, planId: string, dayId: string): Promise<PlanDay> => {
    await verifyPlanOwnership(planId, userId);

    return findDayInPlan(planId, dayId);
  },

  upsert: async (
    userId: string,
    planId: string,
    data: CreatePlanDayRequest,
  ): Promise<{ day: PlanDay; isNew: boolean }> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    if (data.dayTypeId !== undefined && data.dayTypeId !== null) {
      await ensureDayTypeExists(data.dayTypeId);
    }

    const existing = await prisma.planDay.findUnique({
      where: { planId_date: { planId, date: data.date } },
      select: { id: true },
    });
    const isNew = existing === null;

    try {
      const day = await prisma.planDay.upsert({
        where: { planId_date: { planId, date: data.date } },
        update: { ...(data.dayTypeId !== undefined && { dayTypeId: data.dayTypeId }) },
        create: {
          planId,
          date: data.date,
          dayTypeId: data.dayTypeId ?? null,
        },
      });

      return { day: mapToPlanDay(day), isNew };
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanDay" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    dayId: string,
    data: UpdatePlanDayData,
  ): Promise<PlanDay> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const existing = await findDayInPlan(planId, dayId);

    if (data.dayTypeId === undefined) {
      return existing;
    }

    if (data.dayTypeId !== null) {
      await ensureDayTypeExists(data.dayTypeId);
    }

    try {
      const day = await prisma.planDay.update({
        where: { id: dayId },
        data: { dayTypeId: data.dayTypeId },
      });

      return mapToPlanDay(day);
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanDay" });
    }
  },

  delete: async (userId: string, planId: string, dayId: string): Promise<void> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    await findDayInPlan(planId, dayId);

    try {
      await prisma.planDay.delete({ where: { id: dayId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "PlanDay" });
    }
  },
};
