import {
  createAuthGetWithQueryHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  getCalendarWeekParamsSchema,
  getCalendarWeekResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, { weekStart }) => lmsTrainingPlanApi.getCalendarWeek(userId, weekStart),
      getCalendarWeekParamsSchema,
      getCalendarWeekResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
