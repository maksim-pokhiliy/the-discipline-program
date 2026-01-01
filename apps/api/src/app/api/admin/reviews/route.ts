import { adminReviewsApi } from "@repo/api/server";
import { createReviewRequestSchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reviews = await adminReviewsApi.getReviews();

    return NextResponse.json(reviews);
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
