import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformWorkoutsApi } from "@repo/api-server";
import { reorderBlocksParamsSchema, reorderBlocksRequestSchema } from "@repo/contracts/workout";

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { workoutId } = reorderBlocksParamsSchema.parse(await context.params);
  const body = await request.json();
  const { orderedIds } = reorderBlocksRequestSchema.parse(body);

  await platformWorkoutsApi.reorderBlocks(userId, workoutId, orderedIds);

  return NextResponse.json({ success: true });
});
