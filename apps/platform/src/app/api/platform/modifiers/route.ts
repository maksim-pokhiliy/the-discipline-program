import { createAuthPostHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsModifierPlatformApi } from "@repo/api-server/lms";
import { createModifierRequestSchema, modifierSchema } from "@repo/contracts/lms/modifier";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsModifierPlatformApi.create(userId, data),
      createModifierRequestSchema,
      modifierSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
