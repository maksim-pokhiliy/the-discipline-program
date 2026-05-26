import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsExercisePlatformApi } from "@repo/api-server/lms";
import { getExercisesResponseSchema } from "@repo/contracts/lms/exercise";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsExercisePlatformApi.list(userId),
      getExercisesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
