import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemaRowApi } from "@repo/api-server/lms";
import {
  schemaRowByIdParamsSchema,
  updateSchemaRowRequestSchema,
  updateSchemaRowResponseSchema,
} from "@repo/contracts/lms/schema-row";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { schemaRowId }, data) => lmsSchemaRowApi.update(userId, schemaRowId, data),
      schemaRowByIdParamsSchema,
      updateSchemaRowRequestSchema,
      updateSchemaRowResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { schemaRowId }) => lmsSchemaRowApi.delete(userId, schemaRowId),
      schemaRowByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
