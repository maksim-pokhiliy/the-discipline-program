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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const review = await adminReviewsApi.createReview(data);

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to create review:", error);

    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
