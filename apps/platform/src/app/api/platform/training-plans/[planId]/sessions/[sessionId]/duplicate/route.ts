import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  duplicateSessionRequestSchema,
  duplicateSessionResponseSchema,
  sessionByIdParamsSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, sessionId }) => lmsSessionApi.duplicate(userId, planId, sessionId),
      sessionByIdParamsSchema,
      duplicateSessionRequestSchema,
      duplicateSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
