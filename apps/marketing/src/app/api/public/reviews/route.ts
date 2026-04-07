import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { reviewsApi } from "@repo/api-server";
import { getReviewsResponseSchema } from "@repo/contracts/review";

export const GET = withPublicRoute(async () => {
  const reviews = await reviewsApi.getReviews();
  const validated = getReviewsResponseSchema.parse(reviews);

  return NextResponse.json(validated);
});
