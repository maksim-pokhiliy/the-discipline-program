import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanSessionApi } from "@repo/api-server/lms";
import {
  getPlanSessionResponseSchema,
  planSessionParamsSchema,
  updatePlanSessionRequestSchema,
  updatePlanSessionResponseSchema,
} from "@repo/contracts/lms/plan-session";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, sessionId }) => lmsPlanSessionApi.getById(userId, planId, sessionId),
      planSessionParamsSchema,
      getPlanSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, sessionId }, data) =>
        lmsPlanSessionApi.update(userId, planId, sessionId, data),
      planSessionParamsSchema,
      updatePlanSessionRequestSchema,
      updatePlanSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, sessionId }) => lmsPlanSessionApi.delete(userId, planId, sessionId),
      planSessionParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
