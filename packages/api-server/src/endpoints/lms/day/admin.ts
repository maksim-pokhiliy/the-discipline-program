import { Prisma } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import {
  type DaySlot,
  type UpdateDayLabelData,
  type UpdateDayNotesData,
} from "@repo/contracts/lms/day";
import { type AppLevelValue } from "@repo/contracts/lms/label";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToDaySlot } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034 } from "../../../utils";
import { DAY_OF_WEEK_TO_PRISMA, resolveWeekStartDate } from "../_shared";

const DAY_INCLUDE = {
  label: true,
  sessions: {
    orderBy: { order: "asc" as const },
    include: {
      label: true,
      blocks: {
        orderBy: { order: "asc" as const },
        include: {
          labelAssignments: {
            orderBy: { order: "asc" as const },
            include: { label: true },
          },
        },
      },
    },
  },
} as const;

export const lmsDayMetadataApi = {
  setLabel: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayLabelData,
  ): Promise<DaySlot> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    if (data.labelId === null) {
      const existingDay = await prisma.day.findFirst({
        where: { dayOfWeek: prismaDayOfWeek, week: { planId, startDate } },
        select: { id: true },
      });

      if (existingDay === null) {
        return mapToDaySlot(dayOfWeek, null);
      }
    }

    try {
      const day = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            const planCheck = await tx.trainingPlan.findUnique({
              where: { id: planId },
              select: { deletedAt: true, status: true },
            });

            if (!planCheck || planCheck.deletedAt !== null) {
              throw new NotFoundError("Training plan not found", { planId });
            }

            if (planCheck.status === "ARCHIVED") {
              throw new ForbiddenError("Plan is archived; edits not allowed");
            }

            if (data.labelId !== null) {
              const label = await tx.label.findUnique({
                where: { id: data.labelId },
                select: { applicableLevels: true },
              });

              if (!label) {
                throw new NotFoundError("Label not found", { labelId: data.labelId });
              }

              const levels = label.applicableLevels as AppLevelValue[];

              if (!levels.includes("DAY")) {
                throw new BadRequestError("Label is not applicable to DAY level", {
                  labelId: data.labelId,
                  applicableLevels: levels,
                });
              }
            }

            const week = await tx.week.upsert({
              where: { planId_startDate: { planId, startDate } },
              create: { planId, startDate },
              update: {},
            });

            return tx.day.upsert({
              where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
              create: { weekId: week.id, dayOfWeek: prismaDayOfWeek, labelId: data.labelId },
              update: { labelId: data.labelId },
              include: DAY_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToDaySlot(dayOfWeek, day);
    } catch (error) {
      return handlePrismaError(error, { entity: "Day" });
    }
  },

  setNotes: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayNotesData,
  ): Promise<DaySlot> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    if (data.notes === null) {
      const existingDay = await prisma.day.findFirst({
        where: { dayOfWeek: prismaDayOfWeek, week: { planId, startDate } },
        select: { id: true },
      });

      if (existingDay === null) {
        return mapToDaySlot(dayOfWeek, null);
      }
    }

    try {
      const day = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            const planCheck = await tx.trainingPlan.findUnique({
              where: { id: planId },
              select: { deletedAt: true, status: true },
            });

            if (!planCheck || planCheck.deletedAt !== null) {
              throw new NotFoundError("Training plan not found", { planId });
            }

            if (planCheck.status === "ARCHIVED") {
              throw new ForbiddenError("Plan is archived; edits not allowed");
            }

            const week = await tx.week.upsert({
              where: { planId_startDate: { planId, startDate } },
              create: { planId, startDate },
              update: {},
            });

            return tx.day.upsert({
              where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
              create: { weekId: week.id, dayOfWeek: prismaDayOfWeek, notes: data.notes },
              update: { notes: data.notes },
              include: DAY_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToDaySlot(dayOfWeek, day);
    } catch (error) {
      return handlePrismaError(error, { entity: "Day" });
    }
  },
};
