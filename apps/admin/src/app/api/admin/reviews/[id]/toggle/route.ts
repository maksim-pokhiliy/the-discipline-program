import { createToggleHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import { reviewSchema, toggleReviewParamsSchema } from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createToggleHandler(
      cmsReviewAdminApi.toggleReviewStatus,
      toggleReviewParamsSchema,
      reviewSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
