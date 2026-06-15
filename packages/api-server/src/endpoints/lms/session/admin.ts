import { Prisma } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type AppLevelValue } from "@repo/contracts/lms/label";
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
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import {
  DAY_OF_WEEK_TO_PRISMA,
  deepCloneSession,
  resolveWeekStartDate,
  SESSION_SUBTREE_INCLUDE,
} from "../_shared";
import { assertPlanWritable } from "../schema/create-steps";

const FIRST_BLOCK_ORDER = 10;

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
      const session = await retryOnP2034(() =>
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

            if (data.labelId !== null && data.labelId !== undefined) {
              const label = await tx.label.findUnique({
                where: { id: data.labelId },
                select: { applicableLevels: true },
              });

              if (!label) {
                throw new NotFoundError("Label not found", { labelId: data.labelId });
              }

              const levels = label.applicableLevels as AppLevelValue[];

              if (!levels.includes("SESSION")) {
                throw new BadRequestError("Label is not applicable to SESSION level", {
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

            const created = await tx.session.create({
              data: {
                dayId: day.id,
                order: nextOrder,
                labelId: data.labelId ?? null,
                notes: marshalNullableJson(data.notes),
              },
            });

            await tx.block.create({
              data: { sessionId: created.id, order: FIRST_BLOCK_ORDER },
            });

            return created;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  update: async (userId: string, sessionId: string, data: UpdateSessionData): Promise<Session> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    verifyPlanEditable(owner);

    if (data.labelId !== null && data.labelId !== undefined) {
      const label = await prisma.label.findUnique({
        where: { id: data.labelId },
        select: { applicableLevels: true },
      });

      if (!label) {
        throw new NotFoundError("Label not found", { labelId: data.labelId });
      }

      const levels = label.applicableLevels as AppLevelValue[];

      if (!levels.includes("SESSION")) {
        throw new BadRequestError("Label is not applicable to SESSION level", {
          labelId: data.labelId,
          applicableLevels: levels,
        });
      }
    }

    try {
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          ...(data.labelId !== undefined && { labelId: data.labelId }),
          ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
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

  duplicate: async (userId: string, planId: string, sessionId: string): Promise<Session> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Session not found", { planId, sessionId });
    }

    verifyPlanEditable(owner);

    try {
      const session = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanWritable(tx, planId);

            const source = await tx.session.findUniqueOrThrow({
              where: { id: sessionId },
              include: SESSION_SUBTREE_INCLUDE,
            });

            const max = await tx.session.aggregate({
              where: { dayId: owner.dayId },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            const newSessionId = await deepCloneSession(tx, source, owner.dayId, nextOrder);

            return tx.session.findUniqueOrThrow({ where: { id: newSessionId } });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
        ),
      );

      return mapToSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },
};
