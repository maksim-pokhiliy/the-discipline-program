import { reviewsApi } from "@repo/api/server";
import { getReviewsResponseSchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reviews = await reviewsApi.getReviews();
    const validated = getReviewsResponseSchema.parse(reviews);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
