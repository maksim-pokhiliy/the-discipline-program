import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemeTypeAdminApi } from "@repo/api-server/lms";
import { getSchemeTypesResponseSchema } from "@repo/contracts/lms/scheme-type";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      () => lmsSchemeTypeAdminApi.getSchemeTypes(),
      getSchemeTypesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
