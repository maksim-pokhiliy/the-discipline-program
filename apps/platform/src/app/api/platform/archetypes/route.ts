import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsArchetypePlatformApi } from "@repo/api-server/lms";
import { getArchetypesResponseSchema } from "@repo/contracts/lms/archetype";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsArchetypePlatformApi.list(userId),
      getArchetypesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
