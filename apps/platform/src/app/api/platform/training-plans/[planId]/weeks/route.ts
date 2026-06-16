import { createAuthGetByParamHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsWeekApi } from "@repo/api-server/lms";
import {
  listPopulatedWeeksParamsSchema,
  populatedWeeksResponseSchema,
} from "@repo/contracts/lms/week";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId }) => lmsWeekApi.listPopulatedWeeks(userId, planId),
      listPopulatedWeeksParamsSchema,
      populatedWeeksResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
