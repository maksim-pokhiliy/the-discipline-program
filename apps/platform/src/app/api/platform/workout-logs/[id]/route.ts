import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsWorkoutLogApi } from "@repo/api-server/lms";
import {
  deleteWorkoutLogParamsSchema,
  getWorkoutLogByIdParamsSchema,
  getWorkoutLogResponseSchema,
} from "@repo/contracts/lms/workout-log";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { id }) => lmsWorkoutLogApi.getById(userId, id),
      getWorkoutLogByIdParamsSchema,
      getWorkoutLogResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withPlatformAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { id }) => lmsWorkoutLogApi.delete(userId, id),
      deleteWorkoutLogParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
