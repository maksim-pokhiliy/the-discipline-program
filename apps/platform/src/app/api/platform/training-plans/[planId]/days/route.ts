import {
  createAuthGetByParamWithQueryHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanDayApi } from "@repo/api-server/lms";
import {
  createPlanDayRequestSchema,
  createPlanDayResponseSchema,
  getPlanDaysQuerySchema,
  getPlanDaysResponseSchema,
  planByPlanParamsSchema,
} from "@repo/contracts/lms/plan-day";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamWithQueryHandler(
      async (userId, { planId }, query) => ({
        days: await lmsPlanDayApi.listByPlan(userId, planId, query),
      }),
      planByPlanParamsSchema,
      getPlanDaysQuerySchema,
      getPlanDaysResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsPlanDayApi.upsert(userId, planId, data),
      planByPlanParamsSchema,
      createPlanDayRequestSchema,
      createPlanDayResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
