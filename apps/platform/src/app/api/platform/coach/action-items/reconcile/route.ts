import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformCoachActionItemsApi } from "@repo/api-server";
import { reconcileResponseSchema } from "@repo/contracts/coach-action-item";

export const POST = withPlatformAuth(async (_, _context, userId) => {
  const result = await platformCoachActionItemsApi.reconcile(userId);
  const validated = reconcileResponseSchema.parse(result);

  return NextResponse.json(validated);
});
