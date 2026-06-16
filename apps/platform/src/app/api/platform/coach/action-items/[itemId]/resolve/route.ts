import { createAuthPostByParamHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { coachingCoachActionItemApi } from "@repo/api-server/coaching";
import {
  resolveActionItemParamsSchema,
  resolveActionItemRequestSchema,
  resolveActionItemResponseSchema,
} from "@repo/contracts/coaching/coach-action-item";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { itemId }, body) => coachingCoachActionItemApi.resolve(userId, itemId, body),
      resolveActionItemParamsSchema,
      resolveActionItemRequestSchema,
      resolveActionItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
