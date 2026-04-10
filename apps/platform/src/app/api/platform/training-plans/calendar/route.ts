import { createAuthGetWithQueryHandler } from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  getCalendarWeekParamsSchema,
  getCalendarWeekResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetWithQueryHandler(
    (userId, { weekStart }) => lmsTrainingPlanApi.getCalendarWeek(userId, weekStart),
    getCalendarWeekParamsSchema,
    getCalendarWeekResponseSchema,
  ),
);
