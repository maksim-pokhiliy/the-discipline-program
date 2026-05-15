import { Prisma, type DayOfWeek as PrismaDayOfWeek } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import {
  type CreateSessionData,
  type ReorderSessionsData,
  type Session,
  type UpdateSessionData,
} from "@repo/contracts/lms/session";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyPlanEditable,
  verifyPlanOwnership,
  verifySessionOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSession } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";
import { resolveWeekStartDate } from "../_shared";

const DAY_OF_WEEK_TO_PRISMA = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const satisfies Record<DayOfWeek, PrismaDayOfWeek>;

export const lmsSessionApi = {
  create: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: CreateSessionData,
  ): Promise<Session> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    try {
      const session = await prisma.$transaction(
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

          const day = await tx.day.upsert({
            where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
            create: { weekId: week.id, dayOfWeek: prismaDayOfWeek },
            update: {},
          });

          const max = await tx.session.aggregate({
            where: { dayId: day.id },
            _max: { order: true },
          });

          const nextOrder = (max._max.order ?? 0) + 10;

          return tx.session.create({
            data: {
              dayId: day.id,
              order: nextOrder,
              labelId: data.labelId ?? null,
              notes: data.notes ?? null,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return mapToSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  update: async (userId: string, sessionId: string, data: UpdateSessionData): Promise<Session> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    verifyPlanEditable(owner);

    try {
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          ...(data.labelId !== undefined && { labelId: data.labelId }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      return mapToSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  delete: async (userId: string, sessionId: string): Promise<void> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: ReorderSessionsData,
  ): Promise<Session[]> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    const week = await prisma.week.findUnique({
      where: { planId_startDate: { planId, startDate } },
      select: { id: true },
    });

    if (!week) {
      throw new BadRequestError("Cannot reorder sessions in an unmaterialized day slot", {
        planId,
        startDate: startDateParam,
        dayOfWeek,
      });
    }

    const day = await prisma.day.findUnique({
      where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
      select: { id: true },
    });

    if (!day) {
      throw new BadRequestError("Cannot reorder sessions in an unmaterialized day slot", {
        planId,
        startDate: startDateParam,
        dayOfWeek,
      });
    }

    const sessions = await prisma.session.findMany({
      where: { id: { in: data.orderedIds } },
      select: { id: true, dayId: true },
    });

    if (sessions.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent sessions", {
        missing: data.orderedIds.filter((id) => !sessions.some((s) => s.id === id)),
      });
    }

    const foreignDayIds = sessions.filter((s) => s.dayId !== day.id);

    if (foreignDayIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target day", {
        foreignIds: foreignDayIds.map((s) => s.id),
      });
    }

    const dayCount = await prisma.session.count({ where: { dayId: day.id } });

    if (data.orderedIds.length !== dayCount) {
      throw new BadRequestError("orderedIds must include every session in the target day", {
        provided: data.orderedIds.length,
        expected: dayCount,
      });
    }

    try {
      const updated = await prisma.$transaction(
        data.orderedIds.map((id, i) =>
          prisma.session.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      );

      return updated.map(mapToSession);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },
};
