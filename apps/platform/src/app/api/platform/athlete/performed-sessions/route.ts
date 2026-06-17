import { createAuthPostHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsPerformedSessionApi } from "@repo/api-server/lms";
import {
  createPerformedSessionRequestSchema,
  createPerformedSessionResponseSchema,
} from "@repo/contracts/lms/performed-session";

import { withAthleteAuth } from "@app/lib/server/auth";

export const POST = withAthleteAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsPerformedSessionApi.create(userId, data),
      createPerformedSessionRequestSchema,
      createPerformedSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
