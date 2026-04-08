import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { adminReviewsApi } from "@repo/api-server";
import { createReviewRequestSchema, getReviewsResponseSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminReviewsApi.getReviews, getReviewsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminReviewsApi.createReview, createReviewRequestSchema),
);
