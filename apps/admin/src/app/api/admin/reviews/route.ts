import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminReviewsApi } from "@repo/api-server";
import { createReviewRequestSchema, getReviewsResponseSchema } from "@repo/contracts/review";

export const GET = withAdminAuth(
  createGetHandler(adminReviewsApi.getReviews, getReviewsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminReviewsApi.createReview, createReviewRequestSchema),
);
