import { NextResponse } from "next/server";

import { withAdminAuth } from "@repo/api-routes/auth";
import { adminDashboardApi } from "@repo/api-server";
import { getDashboardDataResponseSchema } from "@repo/contracts/dashboard";

export const GET = withAdminAuth(async () => {
  const data = await adminDashboardApi.getDashboardData();
  const validated = getDashboardDataResponseSchema.parse(data);

  return NextResponse.json(validated);
});
