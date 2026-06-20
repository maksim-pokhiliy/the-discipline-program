import { type TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

import { assertPlanAccess } from "./_ownership-grant";

export const verifyRowGroupOwnership = async (
  rowGroupId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  schemaId: string;
  blockId: string;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
}> => {
  const rowGroup = await prisma.rowGroup.findUnique({
    where: { id: rowGroupId },
    select: {
      schemaId: true,
      schema: {
        select: {
          blockId: true,
          block: {
            select: {
              sessionId: true,
              session: {
                select: {
                  dayId: true,
                  day: {
                    select: {
                      weekId: true,
                      week: {
                        select: {
                          planId: true,
                          plan: { select: { creatorId: true, deletedAt: true, status: true } },
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
  });

  if (rowGroup === null) {
    throw new NotFoundError("Row group not found", { rowGroupId });
  }

  const status = await assertPlanAccess(rowGroup.schema.block.session.day.week.plan, userId, {
    message: "Row group not found",
    meta: { rowGroupId },
  });

  return {
    status,
    schemaId: rowGroup.schemaId,
    blockId: rowGroup.schema.blockId,
    sessionId: rowGroup.schema.block.sessionId,
    dayId: rowGroup.schema.block.session.dayId,
    weekId: rowGroup.schema.block.session.day.weekId,
    planId: rowGroup.schema.block.session.day.week.planId,
  };
};
