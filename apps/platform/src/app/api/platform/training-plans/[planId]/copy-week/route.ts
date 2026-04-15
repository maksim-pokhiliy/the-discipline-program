import { createAuthPostByParamHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import { copyWeekParamsSchema, copyWeekRequestSchema } from "@repo/contracts/lms/training-plan";
import { getWorkoutsResponseSchema } from "@repo/contracts/lms/workout";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, { sourceDate, targetDate }) =>
        lmsWorkoutApi.copyWeek(userId, planId, sourceDate, targetDate),
      copyWeekParamsSchema,
      copyWeekRequestSchema,
      getWorkoutsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
