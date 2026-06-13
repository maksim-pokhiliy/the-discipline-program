import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsRowGroupApi } from "@repo/api-server/lms";
import {
  createRowGroupRequestSchema,
  createRowGroupResponseSchema,
  rowGroupByPlanParamsSchema,
} from "@repo/contracts/lms/row-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, request) => lmsRowGroupApi.create(userId, planId, request),
      rowGroupByPlanParamsSchema,
      createRowGroupRequestSchema,
      createRowGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
