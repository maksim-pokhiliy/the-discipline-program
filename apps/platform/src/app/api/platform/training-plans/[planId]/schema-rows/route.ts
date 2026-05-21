import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaRowApi } from "@repo/api-server/lms";
import {
  createSchemaRowRequestSchema,
  createSchemaRowResponseSchema,
  schemaRowByPlanParamsSchema,
} from "@repo/contracts/lms/schema-row";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsSchemaRowApi.create(userId, planId, data),
      schemaRowByPlanParamsSchema,
      createSchemaRowRequestSchema,
      createSchemaRowResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
