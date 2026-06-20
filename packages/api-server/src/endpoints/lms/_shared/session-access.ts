import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../../mappers/lms";

import { sessionAbsoluteDateFromParts, weekMondayOfUtc } from "./date";

export const assertSessionReachableByAthlete = async (
  sessionId: string,
  userId: string,
): Promise<void> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      day: {
        select: {
          dayOfWeek: true,
          week: {
            select: { planId: true, startDate: true, plan: { select: { deletedAt: true } } },
          },
        },
      },
    },
  });

  if (session === null || session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const enrollment = await prisma.planEnrollment.findFirst({
    where: {
      planId: session.day.week.planId,
      athleteId: userId,
      status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE],
      deletedAt: null,
    },
    select: { boardedAt: true, hidePastBeforeBoarding: true },
  });

  if (enrollment === null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const isBeforeBoarding =
    enrollment.hidePastBeforeBoarding &&
    sessionAbsoluteDateFromParts(session.day.week.startDate, session.day.dayOfWeek).getTime() <
      weekMondayOfUtc(enrollment.boardedAt).getTime();

  if (isBeforeBoarding) {
    throw new NotFoundError("Session not found", { sessionId });
  }
};
