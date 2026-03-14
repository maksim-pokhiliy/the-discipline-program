import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformWorkoutsApi } from "@repo/api-server";
import {
  getWorkoutPreviewParamsSchema,
  getWorkoutPreviewResponseSchema,
} from "@repo/contracts/workout";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { planId, id } = getWorkoutPreviewParamsSchema.parse(await context.params);
  const data = await platformWorkoutsApi.getPreview(userId, planId, id);
  const validated = getWorkoutPreviewResponseSchema.parse(data);

  return NextResponse.json(validated);
});
