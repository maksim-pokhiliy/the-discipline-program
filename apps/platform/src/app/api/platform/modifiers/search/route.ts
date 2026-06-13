import {
  createAuthGetWithQueryHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsModifierPlatformApi } from "@repo/api-server/lms";
import {
  getModifiersResponseSchema,
  modifierSearchParamsSchema,
} from "@repo/contracts/lms/modifier";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, query) => lmsModifierPlatformApi.list(userId, query),
      modifierSearchParamsSchema,
      getModifiersResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
