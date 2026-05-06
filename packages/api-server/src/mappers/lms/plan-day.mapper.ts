import { type PlanDay as PrismaPlanDay } from "@prisma/client";

import { type PlanDay } from "@repo/contracts/lms/plan-day";

export const mapToPlanDay = (p: PrismaPlanDay): PlanDay => ({
  id: p.id,
  planId: p.planId,
  date: p.date,
  dayTypeId: p.dayTypeId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
