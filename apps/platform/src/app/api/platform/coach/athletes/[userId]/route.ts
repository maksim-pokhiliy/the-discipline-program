import { createAuthGetByParamHandler } from "@repo/api-routes";
import { coachingCoachAthletesApi } from "@repo/api-server/coaching";
import {
  coachAthleteDetailParamsSchema,
  coachAthleteDetailSchema,
} from "@repo/contracts/coaching/coach-athletes";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { userId: athleteUserId }) =>
      coachingCoachAthletesApi.getAthleteDetail(userId, athleteUserId),
    coachAthleteDetailParamsSchema,
    coachAthleteDetailSchema,
  ),
);
