import { createAuthDeleteHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsPlanCoachAssignmentApi } from "@repo/api-server/lms";
import { deletePlanCoachAssignmentParamsSchema } from "@repo/contracts/lms/plan-coach-assignment";

import { withCoachAuth } from "@app/lib/server/auth";

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, assignmentId }) =>
        lmsPlanCoachAssignmentApi.delete(userId, planId, assignmentId),
      deletePlanCoachAssignmentParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
