import { createAuthPostHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { coachingCoachCredentialApi } from "@repo/api-server/coaching";
import {
  createCoachCredentialRequestSchema,
  createCoachCredentialResponseSchema,
} from "@repo/contracts/coaching/coach-credential";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => coachingCoachCredentialApi.create(userId, data),
      createCoachCredentialRequestSchema,
      createCoachCredentialResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
