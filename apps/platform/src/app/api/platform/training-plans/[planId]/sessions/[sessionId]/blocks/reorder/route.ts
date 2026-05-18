import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockBySessionParamsSchema,
  reorderBlocksRequestSchema,
  reorderBlocksResponseSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, sessionId }, data) =>
        lmsBlockApi.reorder(userId, planId, sessionId, data).then((blocks) => ({ blocks })),
      blockBySessionParamsSchema,
      reorderBlocksRequestSchema,
      reorderBlocksResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
