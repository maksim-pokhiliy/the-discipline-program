import { type TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";
import { TRAINING_PLAN_STATUS_MAP } from "../mappers/lms";

import { isAdminOrHeadCoach } from "./_role-helpers";
import { resolveCallerRole } from "./resolve-caller-role";

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

  if (!group || group.block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Schema group not found", { groupId });
  }

  const plan = group.block.session.day.week.plan;

  const buildResponse = () => ({
    status: TRAINING_PLAN_STATUS_MAP[plan.status],
    blockId: group.blockId,
    sessionId: group.block.sessionId,
    dayId: group.block.session.dayId,
    weekId: group.block.session.day.weekId,
    planId: group.block.session.day.week.planId,
  });

  if (plan.creatorId === userId) {
    return buildResponse();
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return buildResponse();
  }

  throw new ForbiddenError("Schema group does not belong to this coach");
};
