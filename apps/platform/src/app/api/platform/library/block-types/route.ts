import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockTypeAdminApi } from "@repo/api-server/lms";
import { getBlockTypesResponseSchema } from "@repo/contracts/lms/block-type";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(() => lmsBlockTypeAdminApi.getBlockTypes(), getBlockTypesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
