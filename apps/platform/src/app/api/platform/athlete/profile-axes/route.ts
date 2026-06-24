import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { profileAxisPlatformApi } from "@repo/api-server/coaching";
import { getProfileAxesResponseSchema } from "@repo/contracts/coaching/profile-axis";

import { withAthleteAuth } from "@app/lib/server/auth";

export const GET = withAthleteAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => profileAxisPlatformApi.listForAthlete(userId),
      getProfileAxesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
