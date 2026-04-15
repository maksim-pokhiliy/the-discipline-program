import { createAuthGetHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { coachingCoachAthletesApi } from "@repo/api-server/coaching";
import { coachAthletesDataSchema } from "@repo/contracts/coaching/coach-athletes";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => coachingCoachAthletesApi.getAthletes(userId),
      coachAthletesDataSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
