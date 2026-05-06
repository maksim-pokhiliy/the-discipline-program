import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanSessionApi } from "@repo/api-server/lms";
import {
  createPlanSessionRequestSchema,
  createPlanSessionResponseSchema,
  getPlanSessionsResponseSchema,
  planSessionsByDayParamsSchema,
} from "@repo/contracts/lms/plan-session";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      async (userId, { planId, dayId }) => ({
        sessions: await lmsPlanSessionApi.listByDay(userId, planId, dayId),
      }),
      planSessionsByDayParamsSchema,
      getPlanSessionsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, dayId }, data) =>
        lmsPlanSessionApi.create(userId, planId, dayId, { ...data, dayId }),
      planSessionsByDayParamsSchema,
      createPlanSessionRequestSchema,
      createPlanSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
