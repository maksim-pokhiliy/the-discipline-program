import { type PlanSession as PrismaPlanSession } from "@prisma/client";

import { type PlanSession } from "@repo/contracts/lms/plan-session";

export const mapToPlanSession = (p: PrismaPlanSession): PlanSession => ({
  id: p.id,
  dayId: p.dayId,
  order: p.order,
  label: p.label,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
