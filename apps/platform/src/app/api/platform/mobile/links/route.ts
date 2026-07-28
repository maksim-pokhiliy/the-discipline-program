import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import {
  createMobileLinkRequestSchema,
  createMobileLinkResponseSchema,
  getMobileLinksQuerySchema,
  getMobileLinksResponseSchema,
} from "@repo/contracts/coaching/mobile-link";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, { planId, weekStart }) => mobilePublishApi.listLinks(userId, planId, weekStart),
      getMobileLinksQuerySchema,
      getMobileLinksResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => mobilePublishApi.createLink(userId, data),
      createMobileLinkRequestSchema,
      createMobileLinkResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
