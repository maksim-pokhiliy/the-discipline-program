import { NextResponse } from "next/server";

import { adminDashboardApi } from "@repo/api-server";
import { getDashboardDataResponseSchema } from "@repo/contracts/dashboard";

import { withAdminAuth } from "@app/lib/auth";

export const GET = withAdminAuth(async () => {
  const data = await adminDashboardApi.getDashboardData();
  const validated = getDashboardDataResponseSchema.parse(data);

  return NextResponse.json(validated);
});
