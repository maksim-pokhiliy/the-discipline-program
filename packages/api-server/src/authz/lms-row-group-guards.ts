import { type TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";
import { TRAINING_PLAN_STATUS_MAP } from "../mappers/lms";

import { isAdminOrHeadCoach } from "./_role-helpers";
import { resolveCallerRole } from "./resolve-caller-role";

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

  if (!rowGroup || rowGroup.schema.block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Row group not found", { rowGroupId });
  }

  const plan = rowGroup.schema.block.session.day.week.plan;

  const buildResponse = () => ({
    status: TRAINING_PLAN_STATUS_MAP[plan.status],
    schemaId: rowGroup.schemaId,
    blockId: rowGroup.schema.blockId,
    sessionId: rowGroup.schema.block.sessionId,
    dayId: rowGroup.schema.block.session.dayId,
    weekId: rowGroup.schema.block.session.day.weekId,
    planId: rowGroup.schema.block.session.day.week.planId,
  });

  if (plan.creatorId === userId) {
    return buildResponse();
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return buildResponse();
  }

  throw new ForbiddenError("Row group does not belong to this coach");
};
