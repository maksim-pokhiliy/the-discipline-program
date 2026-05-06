import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanItemApi } from "@repo/api-server/lms";
import {
  createPlanItemRequestSchema,
  createPlanItemResponseSchema,
  getPlanItemsResponseSchema,
  planItemsByBlockParamsSchema,
} from "@repo/contracts/lms/plan-item";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      async (userId, { planId, blockId }) => ({
        items: await lmsPlanItemApi.listByBlock(userId, planId, blockId),
      }),
      planItemsByBlockParamsSchema,
      getPlanItemsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, blockId }, data) => lmsPlanItemApi.create(userId, planId, blockId, data),
      planItemsByBlockParamsSchema,
      createPlanItemRequestSchema,
      createPlanItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
