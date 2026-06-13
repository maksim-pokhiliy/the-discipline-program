import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsRowGroupApi } from "@repo/api-server/lms";
import {
  rowGroupByIdParamsSchema,
  updateRowGroupRequestSchema,
  updateRowGroupResponseSchema,
} from "@repo/contracts/lms/row-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { rowGroupId }, data) => lmsRowGroupApi.update(userId, rowGroupId, data),
      rowGroupByIdParamsSchema,
      updateRowGroupRequestSchema,
      updateRowGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { rowGroupId }) => lmsRowGroupApi.delete(userId, rowGroupId),
      rowGroupByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
