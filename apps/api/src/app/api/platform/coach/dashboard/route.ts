import { NextResponse } from "next/server";

import { platformCoachDashboardApi } from "@repo/api-server";
import { coachDashboardDataSchema } from "@repo/contracts/coach-dashboard";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformCoachDashboardApi.getDashboard(userId);
  const validated = coachDashboardDataSchema.parse(data);

  return NextResponse.json(validated);
});
