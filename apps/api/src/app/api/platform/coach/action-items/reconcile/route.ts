import { NextResponse } from "next/server";

import { platformCoachActionItemsApi } from "@repo/api-server";
import { reconcileResponseSchema } from "@repo/contracts/coach-action-item";

import { withPlatformAuth } from "@app/lib/auth";

export const POST = withPlatformAuth(async (_, _context, userId) => {
  const result = await platformCoachActionItemsApi.reconcile(userId);
  const validated = reconcileResponseSchema.parse(result);

  return NextResponse.json(validated);
});
