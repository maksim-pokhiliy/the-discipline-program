import { type DayOfWeek as PrismaDayOfWeek } from "@prisma/client";

import {
  type CreateWeekInput,
  type DuplicateWeekInput,
  type UpdateWeekInput,
} from "@repo/contracts/lms/week";
import { ConflictError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToWeek } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { cloneWeeksIntoPlan } from "./plan-clone";
import { resolvePlanIdForWeek } from "./plan-tree-helpers";

const DAYS_OF_WEEK_PRISMA: readonly PrismaDayOfWeek[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const lmsWeekApi = {
  list: async (userId: string, planId: string) => {
    await verifyPlanOwnership(planId, userId);

    const items = await prisma.week.findMany({
      where: { planId },
      orderBy: { index: "asc" },
    });

    return { items: items.map(mapToWeek), total: items.length };
  },

  getById: async (userId: string, weekId: string) => {
    const planId = await resolvePlanIdForWeek(weekId);

    await verifyPlanOwnership(planId, userId);

    const week = await findOrThrow(prisma.week.findUnique({ where: { id: weekId } }), "Week");

    return mapToWeek(week);
  },

  create: async (userId: string, planId: string, data: CreateWeekInput) => {
    await verifyPlanOwnership(planId, userId);

    try {
      const week = await prisma.$transaction(async (tx) => {
        const created = await tx.week.create({
          data: {
            planId,
            index: data.index,
            label: data.label ?? null,
            notes: data.notes ?? null,
          },
        });

        await tx.day.createMany({
          data: DAYS_OF_WEEK_PRISMA.map((dayOfWeek) => ({
            weekId: created.id,
            dayOfWeek,
          })),
        });

        return created;
      });

      return mapToWeek(week);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week", field: "index" });
    }
  },

  update: async (userId: string, weekId: string, data: UpdateWeekInput) => {
    const planId = await resolvePlanIdForWeek(weekId);

    await verifyPlanOwnership(planId, userId);

    try {
      const week = await prisma.week.update({
        where: { id: weekId },
        data: {
          ...(data.index !== undefined ? { index: data.index } : {}),
          ...(data.label !== undefined ? { label: data.label } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      return mapToWeek(week);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week", field: "index" });
    }
  },

  delete: async (userId: string, weekId: string): Promise<void> => {
    const planId = await resolvePlanIdForWeek(weekId);

    await verifyPlanOwnership(planId, userId);

    try {
      await prisma.week.delete({ where: { id: weekId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Week" });
    }
  },

  duplicate: async (userId: string, weekId: string, data: DuplicateWeekInput) => {
    const planId = await resolvePlanIdForWeek(weekId);

    await verifyPlanOwnership(planId, userId);

    const source = await findOrThrow(
      prisma.week.findUnique({
        where: { id: weekId },
        include: {
          days: {
            include: {
              sessions: {
                include: {
                  blocks: {
                    include: {
                      segments: {
                        include: {
                          setGroups: {
                            include: { entries: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      "Week",
    );

    const conflict = await prisma.week.findUnique({
      where: { planId_index: { planId, index: data.targetIndex } },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictError("Target week index already exists", {
        planId,
        targetIndex: data.targetIndex,
      });
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        await cloneWeeksIntoPlan(tx, planId, [{ ...source, index: data.targetIndex }]);

        return findOrThrow(
          tx.week.findUnique({
            where: { planId_index: { planId, index: data.targetIndex } },
          }),
          "Week",
        );
      });

      return mapToWeek(created);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week" });
    }
  },
};
