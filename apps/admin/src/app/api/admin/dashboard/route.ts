import { createGetHandler } from "@repo/api-routes";
import { cmsDashboardAdminApi } from "@repo/api-server/cms";
import { getDashboardDataResponseSchema } from "@repo/contracts/cms/dashboard";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(cmsDashboardAdminApi.getDashboardData, getDashboardDataResponseSchema),
);
