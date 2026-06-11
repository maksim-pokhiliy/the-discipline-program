import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemaGroupApi } from "@repo/api-server/lms";
import {
  groupByIdParamsSchema,
  updateGroupRequestSchema,
  updateGroupResponseSchema,
} from "@repo/contracts/lms/schema-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { groupId }, data) => lmsSchemaGroupApi.update(userId, groupId, data),
      groupByIdParamsSchema,
      updateGroupRequestSchema,
      updateGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { groupId }) => lmsSchemaGroupApi.delete(userId, groupId),
      groupByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
