import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  reorderSessionsRequestSchema,
  reorderSessionsResponseSchema,
  sessionByDayParamsSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsSessionApi
          .reorder(userId, planId, startDate, dayOfWeek, data)
          .then((sessions) => ({ sessions })),
      sessionByDayParamsSchema,
      reorderSessionsRequestSchema,
      reorderSessionsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
