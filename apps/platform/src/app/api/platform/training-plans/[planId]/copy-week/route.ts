import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import { copyWeekParamsSchema, copyWeekRequestSchema } from "@repo/contracts/training-plan";
import { getWorkoutsResponseSchema } from "@repo/contracts/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(async (request, context, userId) => {
  const { planId } = copyWeekParamsSchema.parse(await context.params);
  const body = await request.json();
  const { sourceDate, targetDate } = copyWeekRequestSchema.parse(body);
  const result = await platformWorkoutsApi.copyWeek(userId, planId, sourceDate, targetDate);
  const validated = getWorkoutsResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
