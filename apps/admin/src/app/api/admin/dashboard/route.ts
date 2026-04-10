import { createGetHandler } from "@repo/api-routes";
import { adminDashboardApi } from "@repo/api-server";
import { getDashboardDataResponseSchema } from "@repo/contracts/cms/dashboard";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminDashboardApi.getDashboardData, getDashboardDataResponseSchema),
);
