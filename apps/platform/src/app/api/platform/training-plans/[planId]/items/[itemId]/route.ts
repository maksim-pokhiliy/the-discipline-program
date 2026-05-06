import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanItemApi } from "@repo/api-server/lms";
import {
  getPlanItemResponseSchema,
  planItemParamsSchema,
  updatePlanItemRequestSchema,
  updatePlanItemResponseSchema,
} from "@repo/contracts/lms/plan-item";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, itemId }) => lmsPlanItemApi.getById(userId, planId, itemId),
      planItemParamsSchema,
      getPlanItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, itemId }, data) => lmsPlanItemApi.update(userId, planId, itemId, data),
      planItemParamsSchema,
      updatePlanItemRequestSchema,
      updatePlanItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, itemId }) => lmsPlanItemApi.delete(userId, planId, itemId),
      planItemParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
