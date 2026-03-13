import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformTrainingPlansApi } from "@repo/api-server";
import {
  getCalendarWeekParamsSchema,
  getCalendarWeekResponseSchema,
} from "@repo/contracts/training-plan";

export const GET = withPlatformAuth(async (request, _context, userId) => {
  const { searchParams } = new URL(request.url);
  const { weekStart } = getCalendarWeekParamsSchema.parse({
    weekStart: searchParams.get("weekStart"),
  });
  const data = await platformTrainingPlansApi.getCalendarWeek(userId, weekStart);
  const validated = getCalendarWeekResponseSchema.parse(data);

  return NextResponse.json(validated);
});
