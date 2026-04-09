import { createAuthActionHandler } from "@repo/api-routes";
import { platformCoachActionItemsApi } from "@repo/api-server";
import {
  resolveActionItemParamsSchema,
  resolveActionItemResponseSchema,
} from "@repo/contracts/coach-action-item";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  createAuthActionHandler(
    (userId, { itemId }) => platformCoachActionItemsApi.resolve(userId, itemId),
    resolveActionItemParamsSchema,
    resolveActionItemResponseSchema,
  ),
);
