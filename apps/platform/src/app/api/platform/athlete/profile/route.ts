import {
  createAuthGetHandler,
  createAuthPutHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingAthleteProfileApi } from "@repo/api-server/coaching";
import {
  getAthleteProfileResponseSchema,
  updateAthleteProfileRequestSchema,
  updateAthleteProfileResponseSchema,
} from "@repo/contracts/coaching/athlete-profile";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => coachingAthleteProfileApi.get(userId),
      getAthleteProfileResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutHandler(
      (userId, data) => coachingAthleteProfileApi.upsert(userId, data),
      updateAthleteProfileRequestSchema,
      updateAthleteProfileResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
