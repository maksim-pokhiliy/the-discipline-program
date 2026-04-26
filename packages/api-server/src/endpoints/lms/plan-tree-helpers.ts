import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

export const resolvePlanIdForWeek = async (weekId: string): Promise<string> => {
  const week = await prisma.week.findUnique({
    where: { id: weekId },
    select: { planId: true },
  });

  if (!week) {
    throw new NotFoundError("Week not found", { weekId });
  }

  return week.planId;
};

export const resolvePlanIdForDay = async (dayId: string): Promise<string> => {
  const day = await prisma.day.findUnique({
    where: { id: dayId },
    select: { week: { select: { planId: true } } },
  });

  if (!day) {
    throw new NotFoundError("Day not found", { dayId });
  }

  return day.week.planId;
};

export const resolvePlanIdForSession = async (sessionId: string): Promise<string> => {
  const session = await prisma.lmsSession.findUnique({
    where: { id: sessionId },
    select: { day: { select: { week: { select: { planId: true } } } } },
  });

  if (!session) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  return session.day.week.planId;
};

export const resolvePlanIdForBlock = async (blockId: string): Promise<string> => {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: {
      session: { select: { day: { select: { week: { select: { planId: true } } } } } },
    },
  });

  if (!block) {
    throw new NotFoundError("Block not found", { blockId });
  }

  return block.session.day.week.planId;
};

export const resolvePlanIdForBlockSegment = async (segmentId: string): Promise<string> => {
  const segment = await prisma.blockSegment.findUnique({
    where: { id: segmentId },
    select: {
      block: {
        select: {
          session: { select: { day: { select: { week: { select: { planId: true } } } } } },
        },
      },
    },
  });

  if (!segment) {
    throw new NotFoundError("Block segment not found", { segmentId });
  }

  return segment.block.session.day.week.planId;
};

export const resolvePlanIdForSetGroup = async (setGroupId: string): Promise<string> => {
  const setGroup = await prisma.setGroup.findUnique({
    where: { id: setGroupId },
    select: {
      segment: {
        select: {
          block: {
            select: {
              session: { select: { day: { select: { week: { select: { planId: true } } } } } },
            },
          },
        },
      },
    },
  });

  if (!setGroup) {
    throw new NotFoundError("Set group not found", { setGroupId });
  }

  return setGroup.segment.block.session.day.week.planId;
};

export const resolvePlanIdForExerciseEntry = async (entryId: string): Promise<string> => {
  const entry = await prisma.exerciseEntry.findUnique({
    where: { id: entryId },
    select: {
      setGroup: {
        select: {
          segment: {
            select: {
              block: {
                select: {
                  session: {
                    select: { day: { select: { week: { select: { planId: true } } } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!entry) {
    throw new NotFoundError("Exercise entry not found", { entryId });
  }

  return entry.setGroup.segment.block.session.day.week.planId;
};
