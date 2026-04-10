import { type PlanEnrollment as PrismaPlanEnrollment } from "@prisma/client";

import { type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";

import { PLAN_ENROLLMENT_STATUS_MAP } from "./enum-maps";

export const mapToPlanEnrollment = (e: PrismaPlanEnrollment): PlanEnrollment => ({
  id: e.id,
  trainingPlanId: e.trainingPlanId,
  userId: e.userId,
  startDate: e.startDate,
  endDate: e.endDate,
  status: PLAN_ENROLLMENT_STATUS_MAP[e.status],
  createdAt: e.createdAt,
});
