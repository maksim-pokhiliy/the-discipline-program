import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { type PlanTimetableResponse } from "@repo/contracts/lms/plan-timetable";

import { prisma } from "../../../db/client";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../../mappers/lms";
import { findOrThrow } from "../../../utils";

import { buildPlanTimetable } from "./build-plan-timetable";
import { timetableInclude } from "./plan-timetable.types";

export const lmsPlanTimetableApi = {
  getTimetable: async (userId: string): Promise<PlanTimetableResponse> => {
    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
      "User",
    );

    const tz = user.timezone ?? "UTC";

    const enrollments = await prisma.planEnrollment.findMany({
      where: {
        athleteId: userId,
        status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE],
        deletedAt: null,
        plan: { deletedAt: null },
      },
      orderBy: { boardedAt: "desc" },
      include: timetableInclude,
    });

    const allSessionIds = enrollments.flatMap((enrollment) =>
      enrollment.plan.weeks.flatMap((week) =>
        week.days.flatMap((day) => day.sessions.map((session) => session.id)),
      ),
    );

    const performed =
      allSessionIds.length === 0
        ? []
        : await prisma.performedSession.findMany({
            where: { userId, sessionId: { in: allSessionIds } },
            select: { sessionId: true },
          });

    const performedSessionIds = new Set(performed.map((entry) => entry.sessionId));

    return buildPlanTimetable({ enrollments, performedSessionIds, tz, now: new Date() });
  },
};
