import { createAuthDeleteHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsAlternatingGroupApi } from "@repo/api-server/lms";
import { alternatingGroupByIdParamsSchema } from "@repo/contracts/lms/alternating-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { groupId }) => lmsAlternatingGroupApi.delete(userId, groupId),
      alternatingGroupByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
