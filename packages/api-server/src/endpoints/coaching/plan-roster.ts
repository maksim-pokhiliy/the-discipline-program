import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";
import { NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToPlanRosterEntry } from "../../mappers/coaching";
import { DEFAULT_LIST_LIMIT } from "../../utils/list-limits";

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
    await verifyPlanOwnership(planId, userId);

    const enrollments = await prisma.planEnrollment.findMany({
      where: { planId },
      include: includeRosterUser,
      orderBy: { createdAt: "desc" },
      take: DEFAULT_LIST_LIMIT,
    });

    return enrollments.map(mapToPlanRosterEntry);
  },

  getById: async (
    userId: string,
    planId: string,
    enrollmentId: string,
  ): Promise<PlanRosterEntry> => {
    await verifyPlanOwnership(planId, userId);

    const enrollment = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      include: includeRosterUser,
    });

    if (!enrollment || enrollment.planId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    return mapToPlanRosterEntry(enrollment);
  },
};
