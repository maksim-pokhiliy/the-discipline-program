import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemaApi } from "@repo/api-server/lms";
import {
  schemaByIdParamsSchema,
  updateSchemaRequestSchema,
  updateSchemaResponseSchema,
} from "@repo/contracts/lms/schema";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { schemaId }, data) => lmsSchemaApi.update(userId, schemaId, data),
      schemaByIdParamsSchema,
      updateSchemaRequestSchema,
      updateSchemaResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { schemaId }) => lmsSchemaApi.delete(userId, schemaId),
      schemaByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
