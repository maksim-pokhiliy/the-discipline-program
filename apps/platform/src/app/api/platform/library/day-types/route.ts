import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsDayTypeAdminApi } from "@repo/api-server/lms";
import { getDayTypesResponseSchema } from "@repo/contracts/lms/day-type";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(() => lmsDayTypeAdminApi.getDayTypes(), getDayTypesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
