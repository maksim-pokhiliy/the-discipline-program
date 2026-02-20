import { NextResponse } from "next/server";

import { reviewsApi } from "@repo/api-server";
import { getReviewsResponseSchema } from "@repo/contracts/review";

import { handleApiError } from "@app/lib/error-handler";

export async function GET() {
  try {
    const reviews = await reviewsApi.getReviews();
    const validated = getReviewsResponseSchema.parse(reviews);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
