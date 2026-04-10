import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";
import { NotFoundError } from "@repo/errors";

import { resolveCoachId, verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToPlanRosterEntry } from "../../mappers/coaching";

const includeRosterUser = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      athleteProfile: { select: { healthStatus: true } },
    },
  },
} as const;

export const coachingPlanRosterApi = {
  list: async (userId: string, planId: string): Promise<PlanRosterEntry[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const enrollments = await prisma.planEnrollment.findMany({
      where: { trainingPlanId: planId },
      include: includeRosterUser,
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map(mapToPlanRosterEntry);
  },

  getById: async (
    userId: string,
    planId: string,
    enrollmentId: string,
  ): Promise<PlanRosterEntry> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const enrollment = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      include: includeRosterUser,
    });

    if (!enrollment || enrollment.trainingPlanId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    return mapToPlanRosterEntry(enrollment);
  },
};
