import { createAuthGetHandler } from "@repo/api-routes";
import { platformCoachDashboardApi } from "@repo/api-server";
import { coachDashboardDataSchema } from "@repo/contracts/coach-dashboard";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => platformCoachDashboardApi.getDashboard(userId),
    coachDashboardDataSchema,
  ),
);
