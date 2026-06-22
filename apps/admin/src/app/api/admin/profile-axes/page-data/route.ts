import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { profileAxisAdminApi } from "@repo/api-server/coaching";
import { getProfileAxesPageDataResponseSchema } from "@repo/contracts/coaching/profile-axis";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(
      profileAxisAdminApi.getProfileAxesPageData,
      getProfileAxesPageDataResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
