import { createAuthGetHandler } from "@repo/api-routes";
import { platformCoachAthletesApi } from "@repo/api-server";
import { coachAthletesDataSchema } from "@repo/contracts/coaching/coach-athletes";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => platformCoachAthletesApi.getAthletes(userId),
    coachAthletesDataSchema,
  ),
);
