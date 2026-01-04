import { NextResponse } from "next/server";

import { adminReviewsApi } from "@repo/api-server";
import { createReviewRequestSchema, getReviewsResponseSchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const reviews = await adminReviewsApi.getReviews();
    const validated = getReviewsResponseSchema.parse(reviews);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createReviewRequestSchema.parse(body);
    const review = await adminReviewsApi.createReview(data);

    return NextResponse.json(review);
  } catch (error) {
    return handleApiError(error);
  }
}
