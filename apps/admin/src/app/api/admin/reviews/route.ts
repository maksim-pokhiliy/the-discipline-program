import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import { createReviewRequestSchema, getReviewsResponseSchema } from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(cmsReviewAdminApi.getReviews, getReviewsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(cmsReviewAdminApi.createReview, createReviewRequestSchema),
);
