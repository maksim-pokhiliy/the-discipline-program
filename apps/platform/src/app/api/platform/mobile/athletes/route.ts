import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import { getMobileAthletesResponseSchema } from "@repo/contracts/coaching/mobile-connection";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => mobilePublishApi.listIndividualAthletes(userId),
      getMobileAthletesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
