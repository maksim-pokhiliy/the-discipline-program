import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanBlockApi } from "@repo/api-server/lms";
import {
  createPlanBlockRequestSchema,
  createPlanBlockResponseSchema,
  getPlanBlocksResponseSchema,
  planBlocksBySessionParamsSchema,
} from "@repo/contracts/lms/plan-block";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      async (userId, { planId, sessionId }) => ({
        blocks: await lmsPlanBlockApi.listBySession(userId, planId, sessionId),
      }),
      planBlocksBySessionParamsSchema,
      getPlanBlocksResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, sessionId }, data) =>
        lmsPlanBlockApi.create(userId, planId, sessionId, data),
      planBlocksBySessionParamsSchema,
      createPlanBlockRequestSchema,
      createPlanBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
