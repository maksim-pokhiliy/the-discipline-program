import { adminReviewsApi } from "@repo/api-server";
import { createReviewRequestSchema, getReviewsResponseSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminReviewsApi.getReviews, getReviewsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminReviewsApi.createReview, createReviewRequestSchema),
);
