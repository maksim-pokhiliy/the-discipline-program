import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import { getTrainingLevelsResponseSchema } from "@repo/contracts/coaching/mobile-connection";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => mobilePublishApi.listTrainingLevels(userId),
      getTrainingLevelsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
