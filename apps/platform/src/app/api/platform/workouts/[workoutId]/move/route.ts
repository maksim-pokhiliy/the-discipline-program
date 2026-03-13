import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformWorkoutsApi } from "@repo/api-server";
import {
  moveWorkoutParamsSchema,
  moveWorkoutRequestSchema,
  moveWorkoutResponseSchema,
} from "@repo/contracts/workout";

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { workoutId } = moveWorkoutParamsSchema.parse(await context.params);
  const body = await request.json();
  const { scheduledDate, targetDayOrderedIds } = moveWorkoutRequestSchema.parse(body);
  const result = await platformWorkoutsApi.move(
    userId,
    workoutId,
    scheduledDate,
    targetDayOrderedIds,
  );
  const validated = moveWorkoutResponseSchema.parse(result);

  return NextResponse.json(validated);
});
