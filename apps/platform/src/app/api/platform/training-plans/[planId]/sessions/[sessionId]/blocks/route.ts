import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockBySessionParamsSchema,
  createBlockRequestSchema,
  createBlockResponseSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, sessionId }, data) => lmsBlockApi.create(userId, planId, sessionId, data),
      blockBySessionParamsSchema,
      createBlockRequestSchema,
      createBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
