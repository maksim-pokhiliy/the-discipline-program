import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockByIdParamsSchema,
  updateBlockRequestSchema,
  updateBlockResponseSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { blockId }, data) => lmsBlockApi.update(userId, blockId, data),
      blockByIdParamsSchema,
      updateBlockRequestSchema,
      updateBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { blockId }) => lmsBlockApi.delete(userId, blockId),
      blockByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
