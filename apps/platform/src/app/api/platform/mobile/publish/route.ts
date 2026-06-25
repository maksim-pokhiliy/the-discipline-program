import { createAuthPostHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import {
  publishMobileRequestSchema,
  publishMobileResponseSchema,
} from "@repo/contracts/coaching/mobile-publish";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => mobilePublishApi.publish(userId, data),
      publishMobileRequestSchema,
      publishMobileResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
