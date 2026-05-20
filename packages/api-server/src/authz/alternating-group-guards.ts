import { type TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";
import { ROLE_MAP } from "../mappers/iam";
import { TRAINING_PLAN_STATUS_MAP } from "../mappers/lms";

import { isAdminOrHeadCoach } from "./_role-helpers";

export const verifyAlternatingGroupOwnership = async (
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
  const group = await prisma.alternatingGroup.findUnique({
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

  if (!group || group.block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Alternating group not found", { groupId });
  }

  const plan = group.block.session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      blockId: group.blockId,
      sessionId: group.block.sessionId,
      dayId: group.block.session.dayId,
      weekId: group.block.session.day.weekId,
      planId: group.block.session.day.week.planId,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      blockId: group.blockId,
      sessionId: group.block.sessionId,
      dayId: group.block.session.dayId,
      weekId: group.block.session.day.weekId,
      planId: group.block.session.day.week.planId,
    };
  }

  throw new ForbiddenError("Alternating group does not belong to this coach");
};
