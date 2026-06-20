import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

import { assertPlanAccess } from "./_ownership-grant";

export const verifyPlanOwnership = async (
  planId: string,
  userId: string,
): Promise<{ status: TrainingPlanStatus }> => {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { creatorId: true, deletedAt: true, status: true },
  });

  const status = await assertPlanAccess(plan, userId, {
    message: "Training plan not found",
    meta: { planId },
  });

  return { status };
};

export const verifyPlanEditable = (plan: { status: TrainingPlanStatus }): void => {
  if (plan.status === TrainingPlanStatus.ARCHIVED) {
    throw new ForbiddenError("Plan is archived; edits not allowed");
  }
};

export const verifySessionOwnership = async (
  sessionId: string,
  userId: string,
): Promise<{ status: TrainingPlanStatus; dayId: string; weekId: string; planId: string }> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
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
  });

  if (session === null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const status = await assertPlanAccess(session.day.week.plan, userId, {
    message: "Session not found",
    meta: { sessionId },
  });

  return {
    status,
    dayId: session.dayId,
    weekId: session.day.weekId,
    planId: session.day.week.planId,
  };
};

export const verifyBlockOwnership = async (
  blockId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
}> => {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
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
  });

  if (block === null) {
    throw new NotFoundError("Block not found", { blockId });
  }

  const status = await assertPlanAccess(block.session.day.week.plan, userId, {
    message: "Block not found",
    meta: { blockId },
  });

  return {
    status,
    sessionId: block.sessionId,
    dayId: block.session.dayId,
    weekId: block.session.day.weekId,
    planId: block.session.day.week.planId,
  };
};

export const verifySchemaOwnership = async (
  schemaId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  blockId: string;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
}> => {
  const schema = await prisma.schema.findUnique({
    where: { id: schemaId },
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

  if (schema === null) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  const status = await assertPlanAccess(schema.block.session.day.week.plan, userId, {
    message: "Schema not found",
    meta: { schemaId },
  });

  return {
    status,
    blockId: schema.blockId,
    sessionId: schema.block.sessionId,
    dayId: schema.block.session.dayId,
    weekId: schema.block.session.day.weekId,
    planId: schema.block.session.day.week.planId,
  };
};

export const verifySchemaRowOwnership = async (
  schemaRowId: string,
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
  const row = await prisma.schemaRow.findUnique({
    where: { id: schemaRowId },
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

  if (row === null) {
    throw new NotFoundError("SchemaRow not found", { schemaRowId });
  }

  const status = await assertPlanAccess(row.schema.block.session.day.week.plan, userId, {
    message: "SchemaRow not found",
    meta: { schemaRowId },
  });

  return {
    status,
    schemaId: row.schemaId,
    blockId: row.schema.blockId,
    sessionId: row.schema.block.sessionId,
    dayId: row.schema.block.session.dayId,
    weekId: row.schema.block.session.day.weekId,
    planId: row.schema.block.session.day.week.planId,
  };
};
