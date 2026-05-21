import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaRowApi } from "@repo/api-server/lms";
import {
  reorderSchemaRowsRequestSchema,
  reorderSchemaRowsResponseSchema,
  schemaRowByPlanParamsSchema,
} from "@repo/contracts/lms/schema-row";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId }, request) =>
        lmsSchemaRowApi
          .reorder(userId, planId, request.schemaId, { orderedIds: request.orderedIds })
          .then((schemaRows) => ({ schemaRows })),
      schemaRowByPlanParamsSchema,
      reorderSchemaRowsRequestSchema,
      reorderSchemaRowsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
