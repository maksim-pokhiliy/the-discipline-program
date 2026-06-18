import { type PlanEnrollment } from "@prisma/client";

import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { type SessionDetailResponse } from "@repo/contracts/lms/session-detail";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../../mappers/lms";
import { findOrThrow } from "../../../utils";
import { loadAthleteLoadContext } from "../athlete-records";

import {
  buildSessionDetail,
  collectExerciseIds,
  sessionAbsoluteDate,
  weekMondayOfUtc,
} from "./build-session-detail";
import { sessionDetailInclude, type SessionDetailRecord } from "./session-detail.types";

const isBeforeBoarding = (session: SessionDetailRecord, enrollment: PlanEnrollment): boolean =>
  enrollment.hidePastBeforeBoarding &&
  sessionAbsoluteDate(session).getTime() < weekMondayOfUtc(enrollment.boardedAt).getTime();

const assertAthleteCanRead = async (
  session: SessionDetailRecord,
  userId: string,
): Promise<void> => {
  const enrollment = await prisma.planEnrollment.findFirst({
    where: {
      planId: session.day.week.planId,
      athleteId: userId,
      status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE],
      deletedAt: null,
    },
  });

  if (enrollment === null || isBeforeBoarding(session, enrollment)) {
    throw new NotFoundError("Session not found");
  }
};

export const lmsSessionDetailApi = {
  getDetail: async (userId: string, sessionId: string): Promise<SessionDetailResponse> => {
    const session = await findOrThrow(
      prisma.session.findUnique({ where: { id: sessionId }, include: sessionDetailInclude }),
      "Session",
    );

    await assertAthleteCanRead(session, userId);

    const ctx = await loadAthleteLoadContext(userId, collectExerciseIds(session));

    const performed = await prisma.performedSession.findMany({
      where: { sessionId, userId },
      include: { results: true },
      orderBy: { performedAt: "asc" },
    });

    return buildSessionDetail({ session, ctx, performed });
  },
};
