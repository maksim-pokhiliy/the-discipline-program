import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import {
  deleteWorkoutParamsSchema,
  getWorkoutByIdParamsSchema,
  getWorkoutResponseSchema,
  updateWorkoutParamsSchema,
  updateWorkoutRequestSchema,
  updateWorkoutResponseSchema,
} from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, id }) => lmsWorkoutApi.getById(userId, planId, id),
      getWorkoutByIdParamsSchema,
      getWorkoutResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, id }, data) => lmsWorkoutApi.update(userId, planId, id, data),
      updateWorkoutParamsSchema,
      updateWorkoutRequestSchema,
      updateWorkoutResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withPlatformAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, id }) => lmsWorkoutApi.delete(userId, planId, id),
      deleteWorkoutParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
