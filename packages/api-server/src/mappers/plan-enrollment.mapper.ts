import { type PlanEnrollment as PrismaPlanEnrollment } from "@prisma/client";

import { type PlanEnrollment } from "@repo/contracts/plan-enrollment";

export const mapToPlanEnrollment = (e: PrismaPlanEnrollment): PlanEnrollment => ({
  id: e.id,
  trainingPlanId: e.trainingPlanId,
  userId: e.userId,
  startDate: e.startDate,
  endDate: e.endDate,
  status: e.status as PlanEnrollment["status"],
  createdAt: e.createdAt,
});
