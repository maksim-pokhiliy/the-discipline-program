import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  assignBlockLabelsRequestSchema,
  assignBlockLabelsResponseSchema,
  blockByIdParamsSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { blockId }, data) => lmsBlockApi.assignLabels(userId, blockId, data),
      blockByIdParamsSchema,
      assignBlockLabelsRequestSchema,
      assignBlockLabelsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
