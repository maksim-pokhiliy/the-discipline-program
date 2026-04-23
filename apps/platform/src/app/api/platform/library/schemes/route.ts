import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { librarySchemePublicApi } from "@repo/api-server/library";
import { getSchemesResponseSchema } from "@repo/contracts/library/scheme";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(() => librarySchemePublicApi.list(), getSchemesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
