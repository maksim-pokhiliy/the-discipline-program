import {
  type CreatePerformedSessionData,
  type PerformedSession,
} from "@repo/contracts/lms/performed-session";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP, mapToPerformedSession } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";

const verifySessionReachableByAthlete = async (
  sessionId: string,
  userId: string,
): Promise<void> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      day: {
        select: { week: { select: { planId: true, plan: { select: { deletedAt: true } } } } },
      },
    },
  });

  if (!session || session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const enrollment = await prisma.planEnrollment.findFirst({
    where: {
      planId: session.day.week.planId,
      athleteId: userId,
      status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE],
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new ForbiddenError("Athlete is not enrolled in the plan owning this session", {
      sessionId,
    });
  }
};

export const lmsPerformedSessionApi = {
  create: async (userId: string, data: CreatePerformedSessionData): Promise<PerformedSession> => {
    await verifySessionReachableByAthlete(data.sessionId, userId);

    try {
      const performed = await prisma.$transaction(async (tx) =>
        tx.performedSession.create({
          data: {
            sessionId: data.sessionId,
            userId,
            performedAt: data.performedAt,
            athleteNotes: data.athleteNotes ?? null,
          },
        }),
      );

      return mapToPerformedSession(performed);
    } catch (error) {
      return handlePrismaError(error, { entity: "Performed session" });
    }
  },
};
