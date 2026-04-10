import { createAuthActionHandler } from "@repo/api-routes";
import { coachingCoachActionItemApi } from "@repo/api-server/coaching";
import {
  resolveActionItemParamsSchema,
  resolveActionItemResponseSchema,
} from "@repo/contracts/coaching/coach-action-item";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  createAuthActionHandler(
    (userId, { itemId }) => coachingCoachActionItemApi.resolve(userId, itemId),
    resolveActionItemParamsSchema,
    resolveActionItemResponseSchema,
  ),
);
