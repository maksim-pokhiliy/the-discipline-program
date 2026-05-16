import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  sessionByDayParamsSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsSessionApi.create(userId, planId, startDate, dayOfWeek, data),
      sessionByDayParamsSchema,
      createSessionRequestSchema,
      createSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
