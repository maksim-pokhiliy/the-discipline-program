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

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId }) => lmsWorkoutApi.getAll(userId, planId),
      getWorkoutsParamsSchema,
      getWorkoutsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withPlatformAuth(
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
