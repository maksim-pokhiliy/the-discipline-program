import { adminReviewsApi } from "@repo/api-server";
import { createReviewRequestSchema, getReviewsResponseSchema } from "@repo/contracts/review";

import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminReviewsApi.getReviews, getReviewsResponseSchema);
export const POST = createPostHandler(adminReviewsApi.createReview, createReviewRequestSchema);
