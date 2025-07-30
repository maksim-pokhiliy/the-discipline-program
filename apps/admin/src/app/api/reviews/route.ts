import { adminReviewsApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reviews = await adminReviewsApi.getReviews();

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);

    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
