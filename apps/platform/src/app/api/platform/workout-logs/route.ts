import {
  createAuthGetHandler,
  createAuthPostHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsWorkoutLogApi } from "@repo/api-server/lms";
import {
  createWorkoutLogRequestSchema,
  createWorkoutLogResponseSchema,
  getWorkoutLogsResponseSchema,
} from "@repo/contracts/lms/workout-log";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetHandler((userId) => lmsWorkoutLogApi.getAll(userId), getWorkoutLogsResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withPlatformAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsWorkoutLogApi.create(userId, data),
      createWorkoutLogRequestSchema,
      createWorkoutLogResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
