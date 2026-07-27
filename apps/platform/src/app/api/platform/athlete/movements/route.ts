import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsExercisePlatformApi } from "@repo/api-server/lms";
import { getAthleteMovementsResponseSchema } from "@repo/contracts/lms/exercise";

import { withAthleteAuth } from "@app/lib/server/auth";

export const GET = withAthleteAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsExercisePlatformApi.listForAthlete(userId),
      getAthleteMovementsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
