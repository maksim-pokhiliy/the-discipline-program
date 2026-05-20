import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaApi } from "@repo/api-server/lms";
import {
  type ReorderSchemasRequest,
  reorderSchemasRequestSchema,
  reorderSchemasResponseSchema,
  schemaByPlanParamsSchema,
} from "@repo/contracts/lms/schema";

import { withCoachAuth } from "@app/lib/server/auth";

const toReorderScope = (request: ReorderSchemasRequest) =>
  request.blockId !== undefined
    ? { blockId: request.blockId }
    : { parentSchemaId: request.parentSchemaId };

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId }, request) =>
        lmsSchemaApi
          .reorder(userId, planId, toReorderScope(request), { orderedIds: request.orderedIds })
          .then((schemas) => ({ schemas })),
      schemaByPlanParamsSchema,
      reorderSchemasRequestSchema,
      reorderSchemasResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
