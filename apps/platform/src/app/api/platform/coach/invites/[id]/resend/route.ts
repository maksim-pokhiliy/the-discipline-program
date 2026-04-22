import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { coachingCoachInviteApi } from "@repo/api-server/coaching";
import {
  resendCoachInviteParamsSchema,
  resendCoachInviteResponseSchema,
} from "@repo/contracts/coaching/coach-invite";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (userId, { id }) => coachingCoachInviteApi.resend(userId, id),
      resendCoachInviteParamsSchema,
      resendCoachInviteResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
