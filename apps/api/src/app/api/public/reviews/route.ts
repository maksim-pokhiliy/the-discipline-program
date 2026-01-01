import { reviewsApi } from "@repo/api/server";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reviews = await reviewsApi.getReviews();

    return NextResponse.json(reviews);
  } catch (error) {
    return handleApiError(error);
  }
}
