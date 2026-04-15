import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import {
  createWorkoutParamsSchema,
  createWorkoutRequestSchema,
  createWorkoutResponseSchema,
  getWorkoutsParamsSchema,
  getWorkoutsResponseSchema,
} from "@repo/contracts/lms/workout";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId }) => lmsWorkoutApi.getAll(userId, planId),
      getWorkoutsParamsSchema,
      getWorkoutsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsWorkoutApi.create(userId, planId, data),
      createWorkoutParamsSchema,
      createWorkoutRequestSchema,
      createWorkoutResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
