import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import {
  createReviewRequestSchema,
  getReviewsResponseSchema,
  reviewSchema,
} from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsReviewAdminApi.getReviews, getReviewsResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(cmsReviewAdminApi.createReview, createReviewRequestSchema, reviewSchema),
    RATE_LIMIT_TIER.API,
  ),
);
