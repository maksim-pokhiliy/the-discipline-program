import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsAlternatingGroupApi } from "@repo/api-server/lms";
import {
  alternatingGroupByPlanParamsSchema,
  createAlternatingGroupRequestSchema,
  createAlternatingGroupResponseSchema,
} from "@repo/contracts/lms/alternating-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsAlternatingGroupApi.create(userId, planId, data),
      alternatingGroupByPlanParamsSchema,
      createAlternatingGroupRequestSchema,
      createAlternatingGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
