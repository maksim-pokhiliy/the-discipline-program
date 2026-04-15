import {
  createAuthVoidPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import {
  reorderWorkoutsParamsSchema,
  reorderWorkoutsRequestSchema,
} from "@repo/contracts/lms/workout";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthVoidPutByParamHandler(
      (userId, { planId }, { orderedIds }) => lmsWorkoutApi.reorder(userId, planId, orderedIds),
      reorderWorkoutsParamsSchema,
      reorderWorkoutsRequestSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
