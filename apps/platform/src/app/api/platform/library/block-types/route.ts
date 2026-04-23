import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { libraryBlockTypePublicApi } from "@repo/api-server/library";
import { getBlockTypesResponseSchema } from "@repo/contracts/library/block-type";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(() => libraryBlockTypePublicApi.list(), getBlockTypesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
