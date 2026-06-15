import {
  createAuthGetHandler,
  createAuthPutHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingCoachProfileApi } from "@repo/api-server/coaching";
import {
  getCoachProfilePageDataResponseSchema,
  updateCoachProfileRequestSchema,
  updateCoachProfileResponseSchema,
} from "@repo/contracts/coaching/coach-profile";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => coachingCoachProfileApi.getPageData(userId),
      getCoachProfilePageDataResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutHandler(
      (userId, data) => coachingCoachProfileApi.update(userId, data),
      updateCoachProfileRequestSchema,
      updateCoachProfileResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
