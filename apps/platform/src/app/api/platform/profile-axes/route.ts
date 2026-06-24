import {
  createAuthGetHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { profileAxisPlatformApi } from "@repo/api-server/coaching";
import {
  createProfileAxisRequestSchema,
  getProfileAxesResponseSchema,
  profileAxisSchema,
} from "@repo/contracts/coaching/profile-axis";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => profileAxisPlatformApi.list(userId),
      getProfileAxesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => profileAxisPlatformApi.create(userId, data),
      createProfileAxisRequestSchema,
      profileAxisSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
