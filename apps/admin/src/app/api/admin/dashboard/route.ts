import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsDashboardAdminApi } from "@repo/api-server/cms";
import { getDashboardDataResponseSchema } from "@repo/contracts/cms/dashboard";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsDashboardAdminApi.getDashboardData, getDashboardDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
