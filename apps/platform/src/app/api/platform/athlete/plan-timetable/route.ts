import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsPlanTimetableApi } from "@repo/api-server/lms";
import { planTimetableResponseSchema } from "@repo/contracts/lms/plan-timetable";

import { withAthleteAuth } from "@app/lib/server/auth";

export const GET = withAthleteAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsPlanTimetableApi.getTimetable(userId),
      planTimetableResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
