import { createAuthPutByParamHandler } from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server";
import {
  moveWorkoutParamsSchema,
  moveWorkoutRequestSchema,
  moveWorkoutResponseSchema,
} from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { workoutId }, { scheduledDate, targetDayOrderedIds }) =>
      platformWorkoutsApi.move(userId, workoutId, scheduledDate, targetDayOrderedIds),
    moveWorkoutParamsSchema,
    moveWorkoutRequestSchema,
    moveWorkoutResponseSchema,
  ),
);
