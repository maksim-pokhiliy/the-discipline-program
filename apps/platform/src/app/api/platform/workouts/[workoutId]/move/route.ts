import { createAuthPutByParamHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import {
  moveWorkoutParamsSchema,
  moveWorkoutRequestSchema,
  moveWorkoutResponseSchema,
} from "@repo/contracts/lms/workout";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { workoutId }, { scheduledDate, targetDayOrderedIds }) =>
        lmsWorkoutApi.move(userId, workoutId, scheduledDate, targetDayOrderedIds),
      moveWorkoutParamsSchema,
      moveWorkoutRequestSchema,
      moveWorkoutResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
