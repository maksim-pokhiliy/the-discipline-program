import {
  createAuthGetHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import {
  connectMobileRequestSchema,
  connectMobileResponseSchema,
  getMobileConnectionsResponseSchema,
} from "@repo/contracts/coaching/mobile-connection";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => mobilePublishApi.listConnections(userId),
      getMobileConnectionsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => mobilePublishApi.connect(userId, data),
      connectMobileRequestSchema,
      connectMobileResponseSchema,
    ),
    RATE_LIMIT_TIER.AUTH,
  ),
);
