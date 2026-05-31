import { type SchemaKind } from "@repo/contracts/lms/schema";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";
import { TRAINING_PLAN_STATUS_MAP } from "../mappers/lms";

import { isAdminOrHeadCoach } from "./_role-helpers";
import { resolveCallerRole } from "./resolve-caller-role";

export const verifyPlanOwnership = async (
  planId: string,
  userId: string,
): Promise<{ status: TrainingPlanStatus }> => {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { creatorId: true, deletedAt: true, status: true },
  });

  if (!plan || plan.deletedAt !== null) {
    throw new NotFoundError("Training plan not found", { planId });
  }

  if (plan.creatorId === userId) {
    return { status: TRAINING_PLAN_STATUS_MAP[plan.status] };
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return { status: TRAINING_PLAN_STATUS_MAP[plan.status] };
  }

  throw new ForbiddenError("Training plan does not belong to this coach");
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

  if (!session || session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const plan = session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      dayId: session.dayId,
      weekId: session.day.weekId,
      planId: session.day.week.planId,
    };
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      dayId: session.dayId,
      weekId: session.day.weekId,
      planId: session.day.week.planId,
    };
  }

  throw new ForbiddenError("Session does not belong to this coach");
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

  if (!block || block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Block not found", { blockId });
  }

  const plan = block.session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      sessionId: block.sessionId,
      dayId: block.session.dayId,
      weekId: block.session.day.weekId,
      planId: block.session.day.week.planId,
    };
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      sessionId: block.sessionId,
      dayId: block.session.dayId,
      weekId: block.session.day.weekId,
      planId: block.session.day.week.planId,
    };
  }

  throw new ForbiddenError("Block does not belong to this coach");
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
  parentSchemaId: string | null;
  kind: SchemaKind;
}> => {
  const schema = await prisma.schema.findUnique({
    where: { id: schemaId },
    select: {
      blockId: true,
      parentSchemaId: true,
      kind: true,
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

  if (!schema || schema.block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  const plan = schema.block.session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      blockId: schema.blockId,
      sessionId: schema.block.sessionId,
      dayId: schema.block.session.dayId,
      weekId: schema.block.session.day.weekId,
      planId: schema.block.session.day.week.planId,
      parentSchemaId: schema.parentSchemaId,
      kind: schema.kind,
    };
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      blockId: schema.blockId,
      sessionId: schema.block.sessionId,
      dayId: schema.block.session.dayId,
      weekId: schema.block.session.day.weekId,
      planId: schema.block.session.day.week.planId,
      parentSchemaId: schema.parentSchemaId,
      kind: schema.kind,
    };
  }

  throw new ForbiddenError("Schema does not belong to this coach");
};

export const verifySchemaRowOwnership = async (
  schemaRowId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  schemaId: string;
  schemaKind: SchemaKind;
  parentSchemaId: string | null;
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
          kind: true,
          parentSchemaId: true,
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

  if (!row || row.schema.block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("SchemaRow not found", { schemaRowId });
  }

  const plan = row.schema.block.session.day.week.plan;

  const buildResponse = () => ({
    status: TRAINING_PLAN_STATUS_MAP[plan.status],
    schemaId: row.schemaId,
    schemaKind: row.schema.kind,
    parentSchemaId: row.schema.parentSchemaId,
    blockId: row.schema.blockId,
    sessionId: row.schema.block.sessionId,
    dayId: row.schema.block.session.dayId,
    weekId: row.schema.block.session.day.weekId,
    planId: row.schema.block.session.day.week.planId,
  });

  if (plan.creatorId === userId) {
    return buildResponse();
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return buildResponse();
  }

  throw new ForbiddenError("SchemaRow does not belong to this coach");
};
