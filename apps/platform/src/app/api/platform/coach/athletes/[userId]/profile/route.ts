import { createAuthGetByParamHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { coachingCoachAthletesApi } from "@repo/api-server/coaching";
import { athleteProfileSchema } from "@repo/contracts/coaching/athlete-profile";
import { coachAthleteDetailParamsSchema } from "@repo/contracts/coaching/coach-athletes";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { userId: athleteUserId }) =>
        coachingCoachAthletesApi.getAthleteProfile(userId, athleteUserId),
      coachAthleteDetailParamsSchema,
      athleteProfileSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
