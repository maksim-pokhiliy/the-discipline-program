import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanBlockApi } from "@repo/api-server/lms";
import {
  getPlanBlockResponseSchema,
  planBlockParamsSchema,
  updatePlanBlockRequestSchema,
  updatePlanBlockResponseSchema,
} from "@repo/contracts/lms/plan-block";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, blockId }) => lmsPlanBlockApi.getById(userId, planId, blockId),
      planBlockParamsSchema,
      getPlanBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, blockId }, data) => lmsPlanBlockApi.update(userId, planId, blockId, data),
      planBlockParamsSchema,
      updatePlanBlockRequestSchema,
      updatePlanBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, blockId }) => lmsPlanBlockApi.delete(userId, planId, blockId),
      planBlockParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
