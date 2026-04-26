import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToTrainingPlanWithWeeks } from "../../mappers/lms";
import { findOrThrow } from "../../utils";

const DEFAULT_WEEK_WINDOW = 4;

export type GetPlanStructureOptions = {
  fromWeek?: number;
  toWeek?: number;
};

export const lmsPlanStructureApi = {
  getStructure: async (userId: string, planId: string, options: GetPlanStructureOptions = {}) => {
    await verifyPlanOwnership(planId, userId);

    const { fromWeek, toWeek } = options;

    const lastWeek = await prisma.week.findFirst({
      where: { planId },
      orderBy: { index: "desc" },
      select: { index: true },
    });

    const maxIndex = lastWeek?.index ?? 0;
    const resolvedTo = toWeek ?? maxIndex;
    const resolvedFrom = fromWeek ?? Math.max(0, resolvedTo - (DEFAULT_WEEK_WINDOW - 1));

    const plan = await findOrThrow(
      prisma.trainingPlan.findUnique({
        where: { id: planId },
        include: {
          weeks: {
            where: { index: { gte: resolvedFrom, lte: resolvedTo } },
            orderBy: { index: "asc" },
            include: {
              days: {
                orderBy: { dayOfWeek: "asc" },
                include: {
                  sessions: {
                    orderBy: { order: "asc" },
                    include: {
                      blocks: {
                        orderBy: { order: "asc" },
                        include: {
                          segments: {
                            orderBy: { order: "asc" },
                            include: {
                              setGroups: {
                                orderBy: { order: "asc" },
                                include: {
                                  entries: { orderBy: { order: "asc" } },
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
            },
          },
        },
      }),
      "Training plan",
    );

    return {
      plan: mapToTrainingPlanWithWeeks(plan),
      window: { fromWeek: resolvedFrom, toWeek: resolvedTo, maxIndex },
    };
  },
};
