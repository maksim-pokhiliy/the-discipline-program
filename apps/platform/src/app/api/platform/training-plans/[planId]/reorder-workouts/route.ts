import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import { reorderWorkoutsParamsSchema, reorderWorkoutsRequestSchema } from "@repo/contracts/workout";

import { withPlatformAuth } from "@app/lib/auth";

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { planId } = reorderWorkoutsParamsSchema.parse(await context.params);
  const body = await request.json();
  const { orderedIds } = reorderWorkoutsRequestSchema.parse(body);

  await platformWorkoutsApi.reorder(userId, planId, orderedIds);

  return NextResponse.json({ success: true });
});
