import {
  createAuthGetHandler,
  createAuthPutHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingCoachProfileApi } from "@repo/api-server/coaching";
import {
  getCoachProfileResponseSchema,
  updateCoachProfileRequestSchema,
  updateCoachProfileResponseSchema,
} from "@repo/contracts/coaching/coach-profile";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => coachingCoachProfileApi.get(userId),
      getCoachProfileResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutHandler(
      (userId, data) => coachingCoachProfileApi.upsert(userId, data),
      updateCoachProfileRequestSchema,
      updateCoachProfileResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
