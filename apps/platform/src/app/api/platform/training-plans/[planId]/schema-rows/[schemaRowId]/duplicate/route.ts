import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaRowApi } from "@repo/api-server/lms";
import {
  duplicateSchemaRowRequestSchema,
  duplicateSchemaRowResponseSchema,
  schemaRowByIdParamsSchema,
} from "@repo/contracts/lms/schema-row";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, schemaRowId }) => lmsSchemaRowApi.duplicate(userId, planId, schemaRowId),
      schemaRowByIdParamsSchema,
      duplicateSchemaRowRequestSchema,
      duplicateSchemaRowResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
