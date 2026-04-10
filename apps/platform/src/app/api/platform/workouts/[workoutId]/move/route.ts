import { createAuthPutByParamHandler } from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import {
  moveWorkoutParamsSchema,
  moveWorkoutRequestSchema,
  moveWorkoutResponseSchema,
} from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { workoutId }, { scheduledDate, targetDayOrderedIds }) =>
      lmsWorkoutApi.move(userId, workoutId, scheduledDate, targetDayOrderedIds),
    moveWorkoutParamsSchema,
    moveWorkoutRequestSchema,
    moveWorkoutResponseSchema,
  ),
);
