import {
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsWeekApi } from "@repo/api-server/lms";
import {
  getWeekResponseSchema,
  updateWeekNotesRequestSchema,
  updateWeekNotesResponseSchema,
  weekByPlanAndDateParamsSchema,
} from "@repo/contracts/lms/week";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      async (userId, { planId, startDate }) => ({
        week: await lmsWeekApi.getByPlanAndDate(userId, planId, startDate),
      }),
      weekByPlanAndDateParamsSchema,
      getWeekResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate }, data) =>
        lmsWeekApi.upsertNotes(userId, planId, startDate, data),
      weekByPlanAndDateParamsSchema,
      updateWeekNotesRequestSchema,
      updateWeekNotesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
