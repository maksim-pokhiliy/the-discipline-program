import { createAuthGetByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionDetailApi } from "@repo/api-server/lms";
import {
  sessionDetailParamsSchema,
  sessionDetailResponseSchema,
} from "@repo/contracts/lms/session-detail";

import { withAthleteAuth } from "@app/lib/server/auth";

export const GET = withAthleteAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, params) => lmsSessionDetailApi.getDetail(userId, params.sessionId),
      sessionDetailParamsSchema,
      sessionDetailResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
