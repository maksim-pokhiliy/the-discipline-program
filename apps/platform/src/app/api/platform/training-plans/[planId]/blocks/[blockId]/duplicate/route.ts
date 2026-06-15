import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockByIdParamsSchema,
  duplicateBlockRequestSchema,
  duplicateBlockResponseSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, blockId }) => lmsBlockApi.duplicate(userId, planId, blockId),
      blockByIdParamsSchema,
      duplicateBlockRequestSchema,
      duplicateBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
