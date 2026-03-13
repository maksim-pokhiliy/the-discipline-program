import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformWorkoutBlocksApi } from "@repo/api-server";
import { reorderSetsParamsSchema, reorderSetsRequestSchema } from "@repo/contracts/workout-block";

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { blockId } = reorderSetsParamsSchema.parse(await context.params);
  const body = await request.json();
  const { orderedIds } = reorderSetsRequestSchema.parse(body);

  await platformWorkoutBlocksApi.reorderSets(userId, blockId, orderedIds);

  return NextResponse.json({ success: true });
});
