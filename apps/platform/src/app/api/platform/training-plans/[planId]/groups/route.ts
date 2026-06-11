import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaGroupApi } from "@repo/api-server/lms";
import {
  createGroupRequestSchema,
  createGroupResponseSchema,
  groupByPlanParamsSchema,
} from "@repo/contracts/lms/schema-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, request) => lmsSchemaGroupApi.create(userId, planId, request),
      groupByPlanParamsSchema,
      createGroupRequestSchema,
      createGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
