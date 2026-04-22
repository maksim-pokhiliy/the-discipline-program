import { createAuthPostHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { coachingCoachInviteApi } from "@repo/api-server/coaching";
import {
  createCoachInviteRequestSchema,
  createCoachInviteResponseSchema,
} from "@repo/contracts/coaching/coach-invite";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => coachingCoachInviteApi.create(userId, data),
      createCoachInviteRequestSchema,
      createCoachInviteResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
