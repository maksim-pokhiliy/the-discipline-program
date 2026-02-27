import { NextResponse } from "next/server";

import { handleApiError } from "@repo/api-routes";
import { reviewsApi } from "@repo/api-server";
import { getReviewsResponseSchema } from "@repo/contracts/review";

export async function GET() {
  try {
    const reviews = await reviewsApi.getReviews();
    const validated = getReviewsResponseSchema.parse(reviews);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
