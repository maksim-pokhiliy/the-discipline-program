import { createAuthPostByParamHandler } from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server";
import { copyWeekParamsSchema, copyWeekRequestSchema } from "@repo/contracts/lms/training-plan";
import { getWorkoutsResponseSchema } from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (userId, { planId }, { sourceDate, targetDate }) =>
      platformWorkoutsApi.copyWeek(userId, planId, sourceDate, targetDate),
    copyWeekParamsSchema,
    copyWeekRequestSchema,
    getWorkoutsResponseSchema,
  ),
);
