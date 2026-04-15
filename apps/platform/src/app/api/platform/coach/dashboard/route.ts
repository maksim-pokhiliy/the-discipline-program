import { createAuthGetHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { coachingCoachDashboardApi } from "@repo/api-server/coaching";
import { coachDashboardDataSchema } from "@repo/contracts/coaching/coach-dashboard";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => coachingCoachDashboardApi.getDashboard(userId),
      coachDashboardDataSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
