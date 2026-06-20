import { type TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

import { assertPlanAccess } from "./_ownership-grant";

export const verifyGroupOwnership = async (
  groupId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  blockId: string;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
}> => {
  const group = await prisma.schemaGroup.findUnique({
    where: { id: groupId },
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
  });

  if (group === null) {
    throw new NotFoundError("Schema group not found", { groupId });
  }

  const status = await assertPlanAccess(group.block.session.day.week.plan, userId, {
    message: "Schema group not found",
    meta: { groupId },
  });

  return {
    status,
    blockId: group.blockId,
    sessionId: group.block.sessionId,
    dayId: group.block.session.dayId,
    weekId: group.block.session.day.weekId,
    planId: group.block.session.day.week.planId,
  };
};
