import { createAuthActionHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { coachingCoachActionItemApi } from "@repo/api-server/coaching";
import {
  resolveActionItemParamsSchema,
  resolveActionItemResponseSchema,
} from "@repo/contracts/coaching/coach-action-item";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (userId, { itemId }) => coachingCoachActionItemApi.resolve(userId, itemId),
      resolveActionItemParamsSchema,
      resolveActionItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
