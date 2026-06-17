import { type PlanEnrollment as PrismaPlanEnrollment } from "@prisma/client";

import { type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";

import { ENROLLMENT_STATUS_MAP } from "./enum-maps-status";

export const mapToPlanEnrollment = (p: PrismaPlanEnrollment): PlanEnrollment => ({
  id: p.id,
  planId: p.planId,
  athleteId: p.athleteId,
  enrolledById: p.enrolledById,
  boardedAt: p.boardedAt,
  status: ENROLLMENT_STATUS_MAP[p.status],
  statusChangedAt: p.statusChangedAt,
  hidePastBeforeBoarding: p.hidePastBeforeBoarding,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
