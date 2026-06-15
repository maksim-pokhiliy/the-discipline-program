import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaApi } from "@repo/api-server/lms";
import {
  duplicateSchemaRequestSchema,
  duplicateSchemaResponseSchema,
  schemaByIdParamsSchema,
} from "@repo/contracts/lms/schema";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, schemaId }) => lmsSchemaApi.duplicate(userId, planId, schemaId),
      schemaByIdParamsSchema,
      duplicateSchemaRequestSchema,
      duplicateSchemaResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
