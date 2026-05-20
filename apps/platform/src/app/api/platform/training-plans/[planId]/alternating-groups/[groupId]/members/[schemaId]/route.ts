import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsAlternatingGroupApi } from "@repo/api-server/lms";
import {
  alternatingGroupMemberParamsSchema,
  removeMemberAlternatingGroupResponseSchema,
} from "@repo/contracts/lms/alternating-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (userId, { groupId, schemaId }) =>
        lmsAlternatingGroupApi.removeMember(userId, groupId, schemaId),
      alternatingGroupMemberParamsSchema,
      removeMemberAlternatingGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
