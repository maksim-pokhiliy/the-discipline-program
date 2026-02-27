import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformCoachActionItemsApi } from "@repo/api-server";
import {
  resolveActionItemParamsSchema,
  resolveActionItemResponseSchema,
} from "@repo/contracts/coach-action-item";

export const POST = withPlatformAuth(async (_, context, userId) => {
  const { itemId } = resolveActionItemParamsSchema.parse(await context.params);
  const result = await platformCoachActionItemsApi.resolve(userId, itemId);
  const validated = resolveActionItemResponseSchema.parse(result);

  return NextResponse.json(validated);
});
