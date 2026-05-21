import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsAlternatingGroupApi } from "@repo/api-server/lms";
import {
  addMemberAlternatingGroupRequestSchema,
  addMemberAlternatingGroupResponseSchema,
  alternatingGroupByIdParamsSchema,
} from "@repo/contracts/lms/alternating-group";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { groupId }, data) =>
        lmsAlternatingGroupApi.addMember(userId, groupId, data.schemaId),
      alternatingGroupByIdParamsSchema,
      addMemberAlternatingGroupRequestSchema,
      addMemberAlternatingGroupResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
