import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  sessionByIdParamsSchema,
  updateSessionRequestSchema,
  updateSessionResponseSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { sessionId }, data) => lmsSessionApi.update(userId, sessionId, data),
      sessionByIdParamsSchema,
      updateSessionRequestSchema,
      updateSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { sessionId }) => lmsSessionApi.delete(userId, sessionId),
      sessionByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
