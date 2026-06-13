import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsModifierAdminApi } from "@repo/api-server/lms";
import { getModifiersPageDataResponseSchema } from "@repo/contracts/lms/modifier";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsModifierAdminApi.getModifiersPageData, getModifiersPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
