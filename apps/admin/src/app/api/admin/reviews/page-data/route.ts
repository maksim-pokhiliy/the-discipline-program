import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import { getReviewsPageDataResponseSchema } from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsReviewAdminApi.getReviewsPageData, getReviewsPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
