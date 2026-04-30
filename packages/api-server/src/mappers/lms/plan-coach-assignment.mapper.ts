import { type PlanCoachAssignment as PrismaPlanCoachAssignment } from "@prisma/client";

import { type PlanCoachAssignment } from "@repo/contracts/lms/plan-coach-assignment";

export const mapToPlanCoachAssignment = (a: PrismaPlanCoachAssignment): PlanCoachAssignment => ({
  id: a.id,
  planId: a.planId,
  coachId: a.coachId,
  canEdit: a.canEdit,
  grantedBy: a.grantedBy,
  grantedAt: a.grantedAt,
});
