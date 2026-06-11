import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaApi } from "@repo/api-server/lms";
import {
  reorderSchemasRequestSchema,
  reorderSchemasResponseSchema,
  schemaByPlanParamsSchema,
} from "@repo/contracts/lms/schema";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId }, request) =>
        lmsSchemaApi
          .reorder(userId, planId, { blockId: request.blockId }, { orderedIds: request.orderedIds })
          .then((schemas) => ({ schemas })),
      schemaByPlanParamsSchema,
      reorderSchemasRequestSchema,
      reorderSchemasResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
