import { type PlanEnrollment as PrismaPlanEnrollment } from "@prisma/client";

import { type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";

import { PLAN_ENROLLMENT_STATUS_MAP } from "./enum-maps";

export const mapToPlanEnrollment = (e: PrismaPlanEnrollment): PlanEnrollment => ({
  id: e.id,
  planId: e.planId,
  userId: e.userId,
  startedAtWeekIndex: e.startedAtWeekIndex,
  startedOnDate: e.startedOnDate,
  status: PLAN_ENROLLMENT_STATUS_MAP[e.status],
  endedOnDate: e.endedOnDate,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});
