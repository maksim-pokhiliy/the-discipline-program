import { createAuthGetByParamHandler } from "@repo/api-routes";
import { platformCoachAthletesApi } from "@repo/api-server";
import {
  coachAthleteDetailParamsSchema,
  coachAthleteDetailSchema,
} from "@repo/contracts/coaching/coach-athletes";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { userId: athleteUserId }) =>
      platformCoachAthletesApi.getAthleteDetail(userId, athleteUserId),
    coachAthleteDetailParamsSchema,
    coachAthleteDetailSchema,
  ),
);
