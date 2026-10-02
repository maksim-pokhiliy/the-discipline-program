import {
  createAuthGetWithQueryHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import {
  getLinkableAthletesQuerySchema,
  getLinkableAthletesResponseSchema,
} from "@repo/contracts/coaching/mobile-link";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, { planId }) => mobilePublishApi.listLinkableAthletes(userId, planId),
      getLinkableAthletesQuerySchema,
      getLinkableAthletesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
