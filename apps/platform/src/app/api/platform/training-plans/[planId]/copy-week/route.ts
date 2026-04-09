import { createAuthPostByParamHandler } from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server";
import { copyWeekParamsSchema, copyWeekRequestSchema } from "@repo/contracts/training-plan";
import { getWorkoutsResponseSchema } from "@repo/contracts/workout";

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
