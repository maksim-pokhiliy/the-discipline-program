import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsWeekApi } from "@repo/api-server/lms";
import {
  cloneWeekFromRequestSchema,
  cloneWeekResponseSchema,
  weekByPlanAndDateParamsSchema,
} from "@repo/contracts/lms/week";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, startDate }, { sourceStartDate }) =>
        lmsWeekApi.cloneFrom(userId, planId, startDate, { sourceStartDate }),
      weekByPlanAndDateParamsSchema,
      cloneWeekFromRequestSchema,
      cloneWeekResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
