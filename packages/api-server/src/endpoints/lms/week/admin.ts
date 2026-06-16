import { Prisma } from "@prisma/client";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import {
  type CloneWeekFromRequest,
  type CloneWeekResponse,
  type GetWeekResponse,
  type PopulatedWeeksResponse,
  type UpdateWeekNotesData,
  type Week,
} from "@repo/contracts/lms/week";
import { BadRequestError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToDaySlot, mapToPopulatedWeek, mapToWeek } from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson, retryOnP2034 } from "../../../utils";
import {
  DAY_OF_WEEK_TO_PRISMA,
  deepCloneSessionsInto,
  resolveWeekStartDate,
  SCHEMA_BODY_INCLUDE,
  SESSION_SUBTREE_INCLUDE,
  type TxClient,
} from "../_shared";
import { assertPlanWritable } from "../schema/create-steps";

const WEEK_SUBTREE_INCLUDE = {
  days: {
    include: {
      label: true,
      sessions: { orderBy: { order: "asc" }, include: SESSION_SUBTREE_INCLUDE },
    },
  },
} satisfies Prisma.WeekInclude;

type SourceWeek = Prisma.WeekGetPayload<{ include: typeof WEEK_SUBTREE_INCLUDE }>;
type SourceDay = SourceWeek["days"][number];

const isEmptySource = (source: SourceWeek): boolean =>
  source.days.length === 0 || source.days.every((day) => day.sessions.length === 0);

const cloneWeekDays = async (tx: TxClient, weekId: string, days: SourceDay[]): Promise<void> => {
  for (const srcDay of days) {
    const newDay = await tx.day.create({
      data: {
        weekId,
        dayOfWeek: srcDay.dayOfWeek,
        labelId: srcDay.labelId,
        notes: marshalNullableJson(srcDay.notes),
      },
    });

    await deepCloneSessionsInto(tx, srcDay.sessions, newDay.id);
  }
};

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
                        include: SCHEMA_BODY_INCLUDE,
                      },
                      groups: true,
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

  listPopulatedWeeks: async (userId: string, planId: string): Promise<PopulatedWeeksResponse> => {
    await verifyPlanOwnership(planId, userId);

    try {
      const weeks = await prisma.week.findMany({
        where: { planId, days: { some: { sessions: { some: {} } } } },
        orderBy: { startDate: "desc" },
        include: { days: { include: { _count: { select: { sessions: true } } } } },
      });

      return { weeks: weeks.map(mapToPopulatedWeek) };
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
        create: { planId, startDate, notes: marshalNullableJson(data.notes) },
        update: { notes: marshalNullableJson(data.notes) },
      });

      return mapToWeek(week);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week" });
    }
  },

  cloneFrom: async (
    userId: string,
    planId: string,
    startDateParam: string,
    data: CloneWeekFromRequest,
  ): Promise<CloneWeekResponse> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const targetStart = resolveWeekStartDate(startDateParam);
    const sourceStart = resolveWeekStartDate(data.sourceStartDate);

    try {
      return await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertPlanWritable(tx, planId);

            const source = await tx.week.findUnique({
              where: { planId_startDate: { planId, startDate: sourceStart } },
              include: WEEK_SUBTREE_INCLUDE,
            });

            if (source === null) {
              throw new BadRequestError("Source week not found in this plan");
            }

            if (isEmptySource(source)) {
              return { cloned: false, reason: "empty-source" };
            }

            const target = await tx.week.upsert({
              where: { planId_startDate: { planId, startDate: targetStart } },
              create: { planId, startDate: targetStart, notes: marshalNullableJson(source.notes) },
              update: { notes: marshalNullableJson(source.notes) },
            });

            await tx.day.deleteMany({ where: { weekId: target.id } });
            await cloneWeekDays(tx, target.id, source.days);

            const reloaded = await tx.week.findUniqueOrThrow({ where: { id: target.id } });

            return { cloned: true, week: mapToWeek(reloaded) };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
        ),
      );
    } catch (error) {
      return handlePrismaError(error, { entity: "Week" });
    }
  },
};
